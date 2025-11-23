"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import { GripVertical, Plus } from "lucide-react";
import {
	SortableContext,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { api } from "~/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { KanbanTask } from "./kanban-task";
import { CreateTaskModal } from "./create-task-modal";
import { EditColumnModal } from "./edit-column-modal";
import type { RouterOutputs } from "~/trpc/react";

type Column = RouterOutputs["board"]["getById"]["columns"][number];

interface KanbanColumnProps {
	column: Column;
	boardId: string;
}

export function KanbanColumn({ column, boardId }: KanbanColumnProps) {
	const {
		attributes,
		listeners,
		setNodeRef: setColumnRef,
		transform,
		transition,
		isDragging: isColumnDragging,
	} = useSortable({
		id: column.id,
		data: {
			type: "column",
			column,
		},
	});

	const { setNodeRef: setDroppableRef } = useDroppable({
		id: column.id,
		data: {
			type: "column",
			column,
		},
	});

	const columnStyle = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isColumnDragging ? 0.5 : 1,
	};

	const taskIds = column.tasks.map((task) => task.id);

	return (
		<div ref={setColumnRef} style={columnStyle} className="flex-shrink-0">
			<Card className="w-64">
				<CardHeader className="pb-3">
					<div className="flex items-center justify-between gap-2">
						<CardTitle className="text-lg flex-1">{column.name}</CardTitle>
						<div className="flex items-center gap-1">
							<EditColumnModal column={column} boardId={boardId} />
							<button
								{...attributes}
								{...listeners}
								className="cursor-grab touch-none p-1 hover:bg-muted rounded"
							>
								<GripVertical className="h-4 w-4 text-muted-foreground" />
							</button>
						</div>
					</div>
					{column.wipLimit && (
						<p className="text-xs text-muted-foreground">
							WIP Limit: {column.tasks.length} / {column.wipLimit}
						</p>
					)}
				</CardHeader>
				<CardContent className="space-y-2">
					<SortableContext
						items={taskIds}
						strategy={verticalListSortingStrategy}
					>
						<div ref={setDroppableRef} className="space-y-2 min-h-[100px]">
							{column.tasks.map((task) => (
								<KanbanTask key={task.id} task={task} boardId={boardId} />
							))}
						</div>
					</SortableContext>
					<CreateTaskModal
						boardId={boardId}
						columnId={column.id}
						trigger={
							<Button variant="ghost" size="sm" className="w-full">
								<Plus className="mr-2 h-4 w-4" />
								Add Task
							</Button>
						}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
