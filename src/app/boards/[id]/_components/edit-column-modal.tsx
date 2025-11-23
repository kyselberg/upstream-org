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
	wipLimit: z.coerce.number().optional().nullable(),
});

type Column = RouterOutputs["board"]["getById"]["columns"][number];

interface EditColumnModalProps {
	column: Column;
	boardId: string;
	trigger?: React.ReactNode;
}

export function EditColumnModal({
	column,
	boardId,
	trigger,
}: EditColumnModalProps) {
	const [open, setOpen] = useState(false);
	const utils = api.useUtils();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: column.name,
			wipLimit: column.wipLimit ?? undefined,
		},
	});

	// Reset form when column changes or modal opens
	useEffect(() => {
		if (open) {
			form.reset({
				name: column.name,
				wipLimit: column.wipLimit ?? undefined,
			});
		}
	}, [column, open, form]);

	const updateColumn = api.column.update.useMutation({
		onSuccess: () => {
			form.reset();
			setOpen(false);
			utils.board.getById.invalidate({ id: boardId });
			toast.success("Column updated successfully");
		},
		onError: (error) => {
			toast.error(error.message || "Failed to update column");
		},
	});

	function onSubmit(values: z.infer<typeof formSchema>) {
		updateColumn.mutate({
			id: column.id,
			boardId,
			name: values.name,
			wipLimit: values.wipLimit ?? null,
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
					<DialogTitle>Edit Column</DialogTitle>
					<DialogDescription>
						Update the column name and WIP limit.
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Column Name</FormLabel>
									<FormControl>
										<Input placeholder="To Do" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="wipLimit"
							render={({ field }) => (
								<FormItem>
									<FormLabel>WIP Limit (Optional)</FormLabel>
									<FormControl>
										<Input
											type="number"
											placeholder="5"
											{...field}
											value={field.value ?? ""}
											onChange={(e) => {
												const value = e.target.value;
												field.onChange(
													value === "" ? null : Number.parseInt(value, 10),
												);
											}}
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
							<Button type="submit" disabled={updateColumn.isPending}>
								{updateColumn.isPending ? "Updating..." : "Update"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}

