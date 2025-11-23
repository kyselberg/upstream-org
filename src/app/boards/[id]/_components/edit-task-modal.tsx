"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import type { RouterOutputs } from "~/trpc/react";
import { api } from "~/trpc/react";

const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
});

type Task =
  RouterOutputs["board"]["getById"]["columns"][number]["tasks"][number];

interface EditTaskModalProps {
  task: Task;
  boardId: string;
  trigger?: React.ReactNode;
}

export function EditTaskModal({ task, boardId, trigger }: EditTaskModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const utils = api.useUtils();

  const { data: users = [] } = api.user.getAll.useQuery();
  const assignMutation = api.task.assign.useMutation({
    onSuccess: () => {
      utils.board.getById.invalidate({ id: boardId });
      setSelectedUserId("");
      toast.success("User assigned successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to assign user");
    },
  });

  const unassignMutation = api.task.unassign.useMutation({
    onSuccess: () => {
      utils.board.getById.invalidate({ id: boardId });
      toast.success("User unassigned successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to unassign user");
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: task.title,
      description: task.description ?? "",
      priority: task.priority,
    },
  });

  // Reset form when task changes or modal opens
  useEffect(() => {
    if (open) {
      form.reset({
        title: task.title,
        description: task.description ?? "",
        priority: task.priority,
      });
      setSelectedUserId("");
    }
  }, [task, open, form]);

  const updateTask = api.task.update.useMutation({
    onSuccess: () => {
      form.reset();
      setOpen(false);
      utils.board.getById.invalidate({ id: boardId });
      toast.success("Task updated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update task");
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    updateTask.mutate({
      id: task.id,
      boardId,
      title: values.title,
      description: values.description || null,
      priority: values.priority,
    });
  }

  function handleAssign() {
    if (!selectedUserId) return;
    assignMutation.mutate({
      taskId: task.id,
      userId: selectedUserId,
      boardId,
    });
  }

  function handleUnassign(userId: string) {
    unassignMutation.mutate({
      taskId: task.id,
      userId,
      boardId,
    });
  }

  const assignedUserIds = task.assignees?.map((a) => a.userId) ?? [];
  const availableUsers = users.filter((u) => !assignedUserIds.includes(u.id));

  const defaultTrigger = (
    <Button variant="ghost" size="icon" className="h-6 w-6">
      <Pencil className="h-3 w-3" />
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>Update the task details.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Task title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Task description"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
              <FormLabel>Assignees</FormLabel>
              {task.assignees && task.assignees.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {task.assignees.map((assignee) => {
                    const user = assignee.user;
                    return (
                      <div
                        key={assignee.userId}
                        className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-sm"
                      >
                        <span className="text-xs">
                          {user?.name ?? user?.email ?? "Unknown"}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUnassign(assignee.userId)}
                          className="ml-1 rounded-full hover:bg-primary/20"
                          disabled={unassignMutation.isPending}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              {availableUsers.length > 0 && (
                <div className="flex gap-2">
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select a user...</option>
                    {availableUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name ?? user.email}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    onClick={handleAssign}
                    disabled={!selectedUserId || assignMutation.isPending}
                    size="sm"
                  >
                    Assign
                  </Button>
                </div>
              )}
              {availableUsers.length === 0 &&
                (!task.assignees || task.assignees.length === 0) && (
                  <p className="text-sm text-muted-foreground">
                    No users available to assign
                  </p>
                )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateTask.isPending}>
                {updateTask.isPending ? "Updating..." : "Update"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
