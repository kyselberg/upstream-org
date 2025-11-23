"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import {
	DndContext,
	DragOverlay,
	PointerSensor,
	useSensor,
	useSensors,
	closestCenter,
	type DragEndEvent,
	type DragStartEvent,
	type DragOverEvent,
} from "@dnd-kit/core";
import {
	SortableContext,
	horizontalListSortingStrategy,
	arrayMove,
} from "@dnd-kit/sortable";
import { toast } from "sonner";

import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { KanbanColumn } from "./kanban-column";
import { KanbanTask } from "./kanban-task";
import { AddColumnColumn } from "./add-column-column";
import type { RouterOutputs } from "~/trpc/react";

type Board = RouterOutputs["board"]["getById"];

interface KanbanBoardProps {
	boardId: string;
	initialBoard: Board;
}

export function KanbanBoard({ boardId, initialBoard }: KanbanBoardProps) {
	const [activeId, setActiveId] = useState<string | null>(null);
	const [activeType, setActiveType] = useState<"column" | "task" | null>(
		null,
	);
	const utils = api.useUtils();

	const { data: board } = api.board.getById.useQuery(
		{ id: boardId },
		{
			initialData: initialBoard,
		},
	);

	const updateColumnOrder = api.column.updateOrder.useMutation({
		onSuccess: () => {
			utils.board.getById.invalidate({ id: boardId });
			toast.success("Columns reordered");
		},
		onError: (error) => {
			// Rollback optimistic update on error
			utils.board.getById.invalidate({ id: boardId });
			toast.error(error.message || "Failed to reorder columns");
		},
	});

	const moveTask = api.task.move.useMutation({
		onSuccess: () => {
			utils.board.getById.invalidate({ id: boardId });
			toast.success("Task moved");
		},
		onError: (error, variables) => {
			// Rollback optimistic update on error
			utils.board.getById.invalidate({ id: boardId });
			toast.error(error.message || "Failed to move task");
		},
	});

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
	);

	const [columns, setColumns] = useState(board?.columns ?? []);

	useEffect(() => {
		if (board?.columns) {
			setColumns(board.columns);
		}
	}, [board?.columns]);

	function handleDragStart(event: DragStartEvent) {
		setActiveId(event.active.id as string);
		const activeData = event.active.data.current;
		setActiveType(activeData?.type ?? null);
	}

	function handleDragOver(event: DragOverEvent) {
		// Visual feedback is handled by dnd-kit automatically
		// We don't update state here to avoid flickering
	}

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;

		if (!over || active.id === over.id) {
			setActiveId(null);
			setActiveType(null);
			return;
		}

		const activeData = active.data.current;
		const overData = over.data.current;

		// Handle column reordering
		if (activeData?.type === "column" && overData?.type === "column") {
			const oldIndex = columns.findIndex((col) => col.id === active.id);
			const newIndex = columns.findIndex((col) => col.id === over.id);

			if (oldIndex !== -1 && newIndex !== -1) {
				const newColumns = arrayMove(columns, oldIndex, newIndex);
				setColumns(newColumns);

				updateColumnOrder.mutate({
					boardId,
					columnOrders: newColumns.map((col, index) => ({
						id: col.id,
						order: index,
					})),
				});
			}
		}

		// Handle task movement between columns
		if (activeData?.type === "task" && overData?.type === "column") {
			const task = activeData.task;
			const targetColumn = overData.column;

			// Don't move if already in the same column
			if (task.columnId === targetColumn.id) {
				setActiveId(null);
				setActiveType(null);
				return;
			}

			// Optimistically update the UI immediately
			setColumns((prevColumns) => {
				return prevColumns.map((col) => {
					// Remove task from source column
					if (col.id === task.columnId) {
						return {
							...col,
							tasks: col.tasks.filter((t) => t.id !== task.id),
						};
					}
					// Add task to target column with updated columnId
					if (col.id === targetColumn.id) {
						return {
							...col,
							tasks: [
								...col.tasks,
								{
									...task,
									columnId: targetColumn.id,
								},
							],
						};
					}
					return col;
				});
			});

			// Then call the mutation
			moveTask.mutate({
				taskId: task.id,
				newColumnId: targetColumn.id,
				boardId,
			});
		}

		// Handle task reordering within same column or moving to different column
		if (activeData?.type === "task" && overData?.type === "task") {
			const activeTask = activeData.task;
			const overTask = overData.task;

			// Only reorder if tasks are in the same column
			if (activeTask.columnId === overTask.columnId) {
				const column = columns.find((col) => col.id === activeTask.columnId);
				if (column) {
					const oldIndex = column.tasks.findIndex((t) => t.id === activeTask.id);
					const newIndex = column.tasks.findIndex((t) => t.id === overTask.id);

					if (oldIndex !== -1 && newIndex !== -1) {
						// Optimistically update the order
						const newTasks = arrayMove(column.tasks, oldIndex, newIndex);
						setColumns((prevColumns) =>
							prevColumns.map((col) =>
								col.id === column.id ? { ...col, tasks: newTasks } : col,
							),
						);
					}
				}
			} else {
				// Move to different column - optimistic update
				setColumns((prevColumns) => {
					return prevColumns.map((col) => {
						// Remove task from source column
						if (col.id === activeTask.columnId) {
							return {
								...col,
								tasks: col.tasks.filter((t) => t.id !== activeTask.id),
							};
						}
						// Add task to target column
						if (col.id === overTask.columnId) {
							// Find the position of the overTask
							const overTaskIndex = col.tasks.findIndex(
								(t) => t.id === overTask.id,
							);
							const newTasks = [...col.tasks];
							newTasks.splice(overTaskIndex, 0, {
								...activeTask,
								columnId: overTask.columnId,
							});
							return {
								...col,
								tasks: newTasks,
							};
						}
						return col;
					});
				});

				// Then call the mutation
				moveTask.mutate({
					taskId: activeTask.id,
					newColumnId: overTask.columnId,
					boardId,
				});
			}
		}

		setActiveId(null);
		setActiveType(null);
	}

	if (!board) {
		return <div>Loading...</div>;
	}

	const activeColumn = activeType === "column" 
		? columns.find((col) => col.id === activeId)
		: null;
	const activeTask = activeType === "task"
		? columns
				.flatMap((col) => col.tasks)
				.find((task) => task.id === activeId)
		: null;

	return (
		<div>
			<div className="mb-4">
				<Link href="/boards">
					<Button variant="outline" size="sm">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Boards
					</Button>
				</Link>
			</div>

			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragStart={handleDragStart}
				onDragOver={handleDragOver}
				onDragEnd={handleDragEnd}
			>
				<SortableContext
					items={columns.map((col) => col.id)}
					strategy={horizontalListSortingStrategy}
				>
					<div className="flex gap-4 overflow-x-auto pb-4">
						{columns.map((column) => (
							<KanbanColumn
								key={column.id}
								column={column}
								boardId={boardId}
							/>
						))}
						<AddColumnColumn boardId={boardId} />
					</div>
				</SortableContext>
				<DragOverlay>
					{activeColumn ? (
						<div className="w-64 rounded-lg border bg-card p-4 shadow-lg">
							{activeColumn.name}
						</div>
					) : activeTask ? (
						<div className="w-64">
							<KanbanTask task={activeTask} boardId={boardId} />
						</div>
					) : null}
				</DragOverlay>
			</DndContext>
		</div>
	);
}
