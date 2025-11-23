"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
import { useState, useEffect } from "react";
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
import { api } from "~/trpc/react";
import type { RouterOutputs } from "~/trpc/react";

const formSchema = z.object({
	title: z.string().min(1, "Title is required").max(255),
	description: z.string().optional(),
	priority: z.enum(["low", "medium", "high"]).optional(),
});

type Task = RouterOutputs["board"]["getById"]["columns"][number]["tasks"][number];

interface EditTaskModalProps {
	task: Task;
	boardId: string;
	trigger?: React.ReactNode;
}

export function EditTaskModal({
	task,
	boardId,
	trigger,
}: EditTaskModalProps) {
	const [open, setOpen] = useState(false);
	const utils = api.useUtils();

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

	const defaultTrigger = (
		<Button variant="ghost" size="icon" className="h-6 w-6">
			<Pencil className="h-3 w-3" />
		</Button>
	);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{trigger ?? defaultTrigger}
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit Task</DialogTitle>
					<DialogDescription>
						Update the task details.
					</DialogDescription>
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

