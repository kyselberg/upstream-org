import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { boards } from "~/server/db/schema";

export const boardRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const allBoards = await ctx.db
      .select()
      .from(boards)
      .where(eq(boards.createdBy, ctx.session.user.id))
      .orderBy(desc(boards.createdAt));

    // Fetch columns for each board
    const boardsWithColumns = await Promise.all(
      allBoards.map(async (board) => {
        const columns = await ctx.db.query.boardColumns.findMany({
          where: (columns, { eq }) => eq(columns.boardId, board.id),
          orderBy: (columns, { asc }) => [asc(columns.order)],
        });

        return {
          ...board,
          columns,
        };
      })
    );

    return boardsWithColumns;
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [board] = await ctx.db
        .select()
        .from(boards)
        .where(eq(boards.id, input.id))
        .limit(1);

      if (!board) {
        throw new Error("Board not found");
      }

      const columns = await ctx.db.query.boardColumns.findMany({
        where: (columns, { eq }) => eq(columns.boardId, board.id),
        orderBy: (columns, { asc }) => [asc(columns.order)],
        with: {
          tasks: {
            orderBy: (tasks, { asc }) => [asc(tasks.createdAt)],
            with: {
              assignees: {
                with: {
                  user: true,
                },
              },
            },
          },
        },
      });

      return {
        ...board,
        columns,
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [board] = await ctx.db
        .insert(boards)
        .values({
          name: input.name,
          description: input.description,
          createdBy: ctx.session.user.id,
        })
        .returning();

      return board;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify board ownership
      const [board] = await ctx.db
        .select()
        .from(boards)
        .where(eq(boards.id, input.id))
        .limit(1);

      if (!board) {
        throw new Error("Board not found");
      }

      if (board.createdBy !== ctx.session.user.id) {
        throw new Error("Unauthorized");
      }

      // Build update data
      const updateData: {
        name?: string;
        description?: string | null;
      } = {};

      if (input.name !== undefined) {
        updateData.name = input.name;
      }

      if (input.description !== undefined) {
        updateData.description = input.description;
      }

      // Update board
      const [updatedBoard] = await ctx.db
        .update(boards)
        .set(updateData)
        .where(eq(boards.id, input.id))
        .returning();

      return updatedBoard;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(boards).where(eq(boards.id, input.id));
      return { success: true };
    }),
});
