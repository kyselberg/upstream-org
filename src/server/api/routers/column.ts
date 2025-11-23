import { z } from "zod";
import { eq, and } from "drizzle-orm";

import {
	createTRPCRouter,
	protectedProcedure,
} from "~/server/api/trpc";
import { boardColumns, boards } from "~/server/db/schema";

export const columnRouter = createTRPCRouter({
	getByBoardId: protectedProcedure
		.input(z.object({ boardId: z.string() }))
		.query(async ({ ctx, input }) => {
			const columns = await ctx.db.query.boardColumns.findMany({
				where: (columns, { eq }) => eq(columns.boardId, input.boardId),
				orderBy: (columns, { asc }) => [asc(columns.order)],
				with: {
					tasks: {
						orderBy: (tasks, { asc }) => [asc(tasks.createdAt)],
					},
				},
			});

			return columns;
		}),

	create: protectedProcedure
		.input(
			z.object({
				boardId: z.string(),
				name: z.string().min(1).max(255),
				wipLimit: z.number().optional(),
			}),
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

			// Get the max order value
			const existingColumns = await ctx.db.query.boardColumns.findMany({
				where: (columns, { eq }) => eq(columns.boardId, input.boardId),
				orderBy: (columns, { desc }) => [desc(columns.order)],
			});

			const maxOrder = existingColumns[0]?.order ?? -1;

			const [column] = await ctx.db
				.insert(boardColumns)
				.values({
					boardId: input.boardId,
					name: input.name,
					wipLimit: input.wipLimit,
					order: maxOrder + 1,
				})
				.returning();

			return column;
		}),

	update: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				boardId: z.string(),
				name: z.string().min(1).max(255).optional(),
				wipLimit: z.number().optional().nullable(),
			}),
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
				.where(
					and(
						eq(boardColumns.id, input.id),
						eq(boardColumns.boardId, input.boardId),
					),
				)
				.limit(1);

			if (!column) {
				throw new Error("Column not found");
			}

			// Build update data
			const updateData: {
				name?: string;
				wipLimit?: number | null;
			} = {};

			if (input.name !== undefined) {
				updateData.name = input.name;
			}

			if (input.wipLimit !== undefined) {
				updateData.wipLimit = input.wipLimit;
			}

			// Update column
			const [updatedColumn] = await ctx.db
				.update(boardColumns)
				.set(updateData)
				.where(
					and(
						eq(boardColumns.id, input.id),
						eq(boardColumns.boardId, input.boardId),
					),
				)
				.returning();

			return updatedColumn;
		}),

	updateOrder: protectedProcedure
		.input(
			z.object({
				boardId: z.string(),
				columnOrders: z.array(
					z.object({
						id: z.string(),
						order: z.number(),
					}),
				),
			}),
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

			// Update each column's order
			await Promise.all(
				input.columnOrders.map(({ id, order }) =>
					ctx.db
						.update(boardColumns)
						.set({ order })
						.where(
							and(
								eq(boardColumns.id, id),
								eq(boardColumns.boardId, input.boardId),
							),
						),
				),
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
				.delete(boardColumns)
				.where(
					and(
						eq(boardColumns.id, input.id),
						eq(boardColumns.boardId, input.boardId),
					),
				);

			return { success: true };
		}),
});

