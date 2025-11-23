"use client";

import { api } from "~/trpc/react";
import { EditBoardModal } from "./edit-board-modal";
import type { RouterOutputs } from "~/trpc/react";

type Board = RouterOutputs["board"]["getById"];

interface BoardHeaderProps {
	boardId: string;
	initialBoard: Board;
}

export function BoardHeader({ boardId, initialBoard }: BoardHeaderProps) {
	const { data: board } = api.board.getById.useQuery(
		{ id: boardId },
		{
			initialData: initialBoard,
		},
	);

	if (!board) {
		return null;
	}

	return (
		<div className="mb-6 flex items-start justify-between gap-4">
			<div className="flex-1">
				<h1 className="text-4xl font-bold">{board.name}</h1>
				{board.description && (
					<p className="mt-2 text-muted-foreground">{board.description}</p>
				)}
			</div>
			<EditBoardModal board={board} />
		</div>
	);
}

