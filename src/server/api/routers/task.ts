import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { boardColumns, boards, tasks } from "~/server/db/schema";

export const taskRouter = createTRPCRouter({
  getByColumnId: protectedProcedure
    .input(z.object({ columnId: z.string() }))
    .query(async ({ ctx, input }) => {
      const columnTasks = await ctx.db.query.tasks.findMany({
        where: (tasks, { eq }) => eq(tasks.columnId, input.columnId),
        orderBy: (tasks, { asc }) => [asc(tasks.createdAt)],
      });

      return columnTasks;
    }),

  create: protectedProcedure
    .input(
      z.object({
        boardId: z.string(),
        columnId: z.string(),
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify board ownership
      const [board] = await ctx.db
        .select()
        .from(boards)
        .where(eq(boards.id, input.boardId))
        .limit(1);

      if (!board || board.createdBy !== ctx.session.user.id) {
        throw new Error("Board not found or unauthorized");
      }

      // Verify column belongs to board
      const [column] = await ctx.db
        .select()
        .from(boardColumns)
        .where(eq(boardColumns.id, input.columnId))
        .limit(1);

      if (!column || column.boardId !== input.boardId) {
        throw new Error("Column not found or does not belong to board");
      }

      const [task] = await ctx.db
        .insert(tasks)
        .values({
          boardId: input.boardId,
          columnId: input.columnId,
          title: input.title,
          description: input.description,
          priority: input.priority ?? "medium",
          createdBy: ctx.session.user.id,
        })
        .returning();

      return task;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        boardId: z.string(),
        title: z.string().min(1).max(255).optional(),
        description: z.string().optional().nullable(),
        priority: z.enum(["low", "medium", "high"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify board ownership
      const [board] = await ctx.db
        .select()
        .from(boards)
        .where(eq(boards.id, input.boardId))
        .limit(1);

      if (!board || board.createdBy !== ctx.session.user.id) {
        throw new Error("Board not found or unauthorized");
      }

      // Verify task exists and belongs to board
      const [task] = await ctx.db
        .select()
        .from(tasks)
        .where(and(eq(tasks.id, input.id), eq(tasks.boardId, input.boardId)))
        .limit(1);

      if (!task) {
        throw new Error("Task not found");
      }

      // Build update data
      const updateData: {
        title?: string;
        description?: string | null;
        priority?: "low" | "medium" | "high";
      } = {};

      if (input.title !== undefined) {
        updateData.title = input.title;
      }

      if (input.description !== undefined) {
        updateData.description = input.description;
      }

      if (input.priority !== undefined) {
        updateData.priority = input.priority;
      }

      // Update task
      const [updatedTask] = await ctx.db
        .update(tasks)
        .set(updateData)
        .where(and(eq(tasks.id, input.id), eq(tasks.boardId, input.boardId)))
        .returning();

      return updatedTask;
    }),

  move: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        newColumnId: z.string(),
        boardId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify board ownership
      const [board] = await ctx.db
        .select()
        .from(boards)
        .where(eq(boards.id, input.boardId))
        .limit(1);

      if (!board || board.createdBy !== ctx.session.user.id) {
        throw new Error("Board not found or unauthorized");
      }

      // Verify column belongs to board
      const [column] = await ctx.db
        .select()
        .from(boardColumns)
        .where(eq(boardColumns.id, input.newColumnId))
        .limit(1);

      if (!column || column.boardId !== input.boardId) {
        throw new Error("Column not found or does not belong to board");
      }

      await ctx.db
        .update(tasks)
        .set({ columnId: input.newColumnId })
        .where(
          and(eq(tasks.id, input.taskId), eq(tasks.boardId, input.boardId))
        );

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string(), boardId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify board ownership
      const [board] = await ctx.db
        .select()
        .from(boards)
        .where(eq(boards.id, input.boardId))
        .limit(1);

      if (!board || board.createdBy !== ctx.session.user.id) {
        throw new Error("Board not found or unauthorized");
      }

      await ctx.db
        .delete(tasks)
        .where(and(eq(tasks.id, input.id), eq(tasks.boardId, input.boardId)));

      return { success: true };
    }),
});
