"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Pencil } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { EditTaskModal } from "./edit-task-modal";
import type { RouterOutputs } from "~/trpc/react";

type Task = RouterOutputs["board"]["getById"]["columns"][number]["tasks"][number];

interface KanbanTaskProps {
	task: Task;
	boardId: string;
}

export function KanbanTask({ task, boardId }: KanbanTaskProps) {
	const [isHovered, setIsHovered] = useState(false);
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id: task.id,
		data: {
			type: "task",
			task,
		},
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	const priorityColors = {
		low: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
		medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
		high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			<Card className="cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md relative group">
				<CardContent className="p-3">
					<div className="space-y-2">
						<div className="flex items-start justify-between gap-2">
							<p className="text-sm font-medium flex-1">{task.title}</p>
							{isHovered && (
								<div
									onMouseDown={(e) => e.stopPropagation()}
									onClick={(e) => e.stopPropagation()}
									className="flex-shrink-0"
								>
									<EditTaskModal
										task={task}
										boardId={boardId}
										trigger={
											<Button
												variant="ghost"
												size="icon"
												className="h-6 w-6"
											>
												<Pencil className="h-3 w-3" />
											</Button>
										}
									/>
								</div>
							)}
						</div>
						{task.description && (
							<p className="text-xs text-muted-foreground line-clamp-2">
								{task.description}
							</p>
						)}
						<div className="flex items-center justify-between">
							<span
								className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[task.priority]}`}
							>
								{task.priority}
							</span>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
