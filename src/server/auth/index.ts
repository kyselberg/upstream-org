import { auth as clerkAuth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { cache } from "react";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";

/**
 * Get the current user from Clerk and sync with database
 * If user doesn't exist in DB, fetch from Clerk and create them
 */
export const auth = cache(async () => {
  const { userId: clerkUserId } = await clerkAuth();

  if (!clerkUserId) {
    return null;
  }

  // Get user from database
  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkUserId))
    .limit(1);

  // If user doesn't exist in DB, fetch from Clerk and create them
  if (!user) {
    try {
      // Fetch user data from Clerk using currentUser
      const clerkUser = await currentUser();

      if (!clerkUser) {
        return null;
      }

      // Get primary email
      const emailAddresses = clerkUser.emailAddresses ?? [];
      const primaryEmail =
        emailAddresses.find(
          (email) => email.id === clerkUser.primaryEmailAddressId
        )?.emailAddress ?? emailAddresses[0]?.emailAddress;

      if (!primaryEmail) {
        console.error("User has no email address");
        return null;
      }

      // Create user in database
      const [newUser] = await db
        .insert(users)
        .values({
          clerkId: clerkUserId,
          email: primaryEmail,
          name:
            clerkUser.firstName && clerkUser.lastName
              ? `${clerkUser.firstName} ${clerkUser.lastName}`
              : clerkUser.firstName ??
                clerkUser.lastName ??
                clerkUser.username ??
                null,
          image: clerkUser.imageUrl ?? null,
          emailVerified:
            emailAddresses[0]?.verification?.status === "verified"
              ? new Date()
              : null,
          role: "guest", // Default role
        })
        .returning();

      if (!newUser) {
        console.error("Failed to create user in database");
        return null;
      }

      user = newUser;
      console.log(`User created on-demand: ${clerkUserId} (${primaryEmail})`);
    } catch (error) {
      console.error("Error creating user from Clerk:", error);
      return null;
    }
  }

  if (!user) {
    return null;
  }

  return {
    user: {
      id: user.id,
      clerkId: user.clerkId,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
    },
  };
});
