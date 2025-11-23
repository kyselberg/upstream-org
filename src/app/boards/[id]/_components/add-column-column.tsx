"use client";

import { Plus } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { CreateColumnModal } from "./create-column-modal";

interface AddColumnColumnProps {
	boardId: string;
}

export function AddColumnColumn({ boardId }: AddColumnColumnProps) {
	return (
		<div className="flex-shrink-0">
			<Card className="w-64 border-dashed border-2">
				<CardContent className="flex min-h-[400px] items-center justify-center p-6">
					<CreateColumnModal
						boardId={boardId}
						trigger={
							<Button
								variant="ghost"
								className="flex flex-col items-center gap-2 h-auto py-6 px-8 hover:bg-muted/50"
							>
								<Plus className="h-6 w-6 text-muted-foreground" />
								<span className="text-muted-foreground">Add Column</span>
							</Button>
						}
					/>
				</CardContent>
			</Card>
		</div>
	);
}

