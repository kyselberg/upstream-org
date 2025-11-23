import { type UserJSON, type WebhookEvent } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { Webhook } from "svix";

import { env } from "~/env";
import { db } from "~/server/db";
import { taskAssignees, users } from "~/server/db/schema";

export async function POST(req: Request) {
  // Get the Svix headers for verification
  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Error occurred -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Verify webhook secret
  const webhookSecret = env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return new Response("Error: CLERK_WEBHOOK_SECRET not configured", {
      status: 500,
    });
  }

  // Create a new Svix instance with your secret
  const wh = new Webhook(webhookSecret);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occurred", {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;

  try {
    switch (eventType) {
      case "user.created": {
        await handleUserCreated(evt.data as UserJSON);
        break;
      }
      case "user.updated": {
        await handleUserUpdated(evt.data as UserJSON);
        break;
      }
      case "user.deleted": {
        await handleUserDeleted(evt.data as { id: string });
        break;
      }
      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    return new Response("Webhook processed successfully", { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response("Error processing webhook", { status: 500 });
  }
}

async function handleUserCreated(data: UserJSON) {
  const clerkId = data.id;

  if (!clerkId) {
    throw new Error("User created without id");
  }

  const emailAddresses = data.email_addresses ?? [];
  const primaryEmail =
    emailAddresses.find((email) => email.id === data.primary_email_address_id)
      ?.email_address ?? emailAddresses[0]?.email_address;

  if (!primaryEmail) {
    throw new Error("User created without email address");
  }

  // Check if user already exists (idempotency)
  const existingUser = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });

  if (existingUser) {
    console.log(
      `User with clerkId ${clerkId} already exists, skipping creation`
    );
    return;
  }

  // Create new user
  await db.insert(users).values({
    clerkId,
    email: primaryEmail,
    name:
      data.first_name && data.last_name
        ? `${data.first_name} ${data.last_name}`
        : data.first_name ?? data.last_name ?? data.username ?? null,
    image: data.image_url ?? null,
    emailVerified:
      data.email_addresses?.[0]?.verification?.status === "verified"
        ? new Date()
        : null,
    role: "guest", // Default role
  });

  console.log(`User created: ${clerkId} (${primaryEmail})`);
}

async function handleUserUpdated(data: UserJSON) {
  const clerkId = data.id;

  if (!clerkId) {
    throw new Error("User updated without id");
  }

  const emailAddresses = data.email_addresses ?? [];
  const primaryEmail =
    emailAddresses.find((email) => email.id === data.primary_email_address_id)
      ?.email_address ?? emailAddresses[0]?.email_address;

  if (!primaryEmail) {
    throw new Error("User updated without email address");
  }

  // Find existing user
  const existingUser = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });

  if (!existingUser) {
    // User doesn't exist, create them (handles race conditions)
    console.log(`User ${clerkId} not found, creating from update event`);
    await handleUserCreated(data);
    return;
  }

  // Update user
  const updateData: {
    email?: string;
    name?: string | null;
    image?: string | null;
    emailVerified?: Date | null;
  } = {};

  // Update email if changed
  if (primaryEmail !== existingUser.email) {
    updateData.email = primaryEmail;
  }

  // Update name if changed
  const newName =
    data.first_name && data.last_name
      ? `${data.first_name} ${data.last_name}`
      : data.first_name ?? data.last_name ?? data.username ?? null;
  if (newName !== existingUser.name) {
    updateData.name = newName;
  }

  // Update image if changed
  if (data.image_url !== existingUser.image) {
    updateData.image = data.image_url ?? null;
  }

  // Update email verification status
  const primaryEmailObj = emailAddresses.find(
    (email) => email.id === data.primary_email_address_id
  );
  const isVerified = primaryEmailObj?.verification?.status === "verified";
  if (isVerified && !existingUser.emailVerified) {
    updateData.emailVerified = new Date();
  }

  // Only update if there are changes
  if (Object.keys(updateData).length > 0) {
    await db.update(users).set(updateData).where(eq(users.clerkId, clerkId));

    console.log(`User updated: ${clerkId}`);
  }
}

async function handleUserDeleted(data: { id: string }) {
  const clerkId = data.id;

  if (!clerkId) {
    console.error("User deleted event missing id");
    return;
  }

  // Find existing user
  const existingUser = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });

  if (!existingUser) {
    console.log(`User ${clerkId} not found, skipping deletion`);
    return;
  }

  // Delete task assignments first (tasks themselves are preserved)
  // Tasks created by this user will have createdBy set to null automatically
  await db
    .delete(taskAssignees)
    .where(eq(taskAssignees.userId, existingUser.id));

  // Delete user - tasks are preserved with createdBy set to null
  await db.delete(users).where(eq(users.clerkId, clerkId));

  console.log(`User deleted: ${clerkId}`);
}
