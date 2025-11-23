import { notFound } from "next/navigation";

import { api } from "~/trpc/server";
import { auth } from "~/server/auth";
import { KanbanBoard } from "./_components/kanban-board";
import { BoardHeader } from "./_components/board-header";

export default async function BoardPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const session = await auth();

	if (!session?.user) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<p className="text-lg">Please sign in to view this board</p>
			</div>
		);
	}

	const { id } = await params;
	const board = await api.board.getById({ id });

	if (!board) {
		notFound();
	}

	return (
		<div className="container mx-auto p-6">
			<BoardHeader boardId={id} initialBoard={board} />
			<KanbanBoard boardId={id} initialBoard={board} />
		</div>
	);
}

