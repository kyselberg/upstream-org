"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Pencil } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import type { RouterOutputs } from "~/trpc/react";
import { EditTaskModal } from "./edit-task-modal";

type Task =
  RouterOutputs["board"]["getById"]["columns"][number]["tasks"][number];

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
    medium:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
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
                      <Button variant="ghost" size="icon" className="h-6 w-6">
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
            <div className="flex items-center justify-between gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  priorityColors[task.priority]
                }`}
              >
                {task.priority}
              </span>
              {task.assignees && task.assignees.length > 0 && (
                <div className="flex -space-x-2">
                  {task.assignees.slice(0, 3).map((assignee) => {
                    const user = assignee.user;
                    return (
                      <div
                        key={assignee.userId}
                        className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-primary/20 text-xs font-medium"
                        title={user?.name ?? user?.email ?? "Unknown"}
                      >
                        {user?.image ? (
                          <img
                            src={user.image}
                            alt={user?.name ?? user?.email ?? "User"}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-[10px]">
                            {(user?.name ??
                              user?.email ??
                              "U")[0]?.toUpperCase()}
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {task.assignees.length > 3 && (
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-medium"
                      title={`+${task.assignees.length - 3} more`}
                    >
                      +{task.assignees.length - 3}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
