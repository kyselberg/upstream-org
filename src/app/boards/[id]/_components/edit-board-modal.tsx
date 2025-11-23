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
	name: z.string().min(1, "Name is required").max(255),
	description: z.string().optional(),
});

type Board = RouterOutputs["board"]["getById"];

interface EditBoardModalProps {
	board: Board;
	trigger?: React.ReactNode;
}

export function EditBoardModal({ board, trigger }: EditBoardModalProps) {
	const [open, setOpen] = useState(false);
	const utils = api.useUtils();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: board.name,
			description: board.description ?? "",
		},
	});

	// Reset form when board changes or modal opens
	useEffect(() => {
		if (open) {
			form.reset({
				name: board.name,
				description: board.description ?? "",
			});
		}
	}, [board, open, form]);

	const updateBoard = api.board.update.useMutation({
		onSuccess: () => {
			form.reset();
			setOpen(false);
			utils.board.getById.invalidate({ id: board.id });
			utils.board.getAll.invalidate();
			toast.success("Board updated successfully");
		},
		onError: (error) => {
			toast.error(error.message || "Failed to update board");
		},
	});

	function onSubmit(values: z.infer<typeof formSchema>) {
		updateBoard.mutate({
			id: board.id,
			name: values.name,
			description: values.description || null,
		});
	}

	const defaultTrigger = (
		<Button variant="ghost" size="icon" className="h-8 w-8">
			<Pencil className="h-4 w-4" />
		</Button>
	);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit Board</DialogTitle>
					<DialogDescription>
						Update the board name and description.
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Board Name</FormLabel>
									<FormControl>
										<Input placeholder="My Board" {...field} />
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
											placeholder="Board description"
											{...field}
											value={field.value ?? ""}
										/>
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
							<Button type="submit" disabled={updateBoard.isPending}>
								{updateBoard.isPending ? "Updating..." : "Update"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}

