import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";
import { CreateBoardModal } from "./_components/create-board-modal";

export default async function BoardsPage() {
  const session = await auth();

  if (!session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg">Please sign in to view boards</p>
      </div>
    );
  }

  const boards = await api.board.getAll();

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Boards</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your kanban boards
          </p>
        </div>
        <CreateBoardModal />
      </div>

      {boards.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed">
          <p className="mb-4 text-lg text-muted-foreground">
            No boards yet. Create your first board!
          </p>
          <CreateBoardModal />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {boards.map((board) => (
            <Link key={board.id} href={`/boards/${board.id}`}>
              <Card className="transition-all hover:shadow-lg">
                <CardHeader>
                  <CardTitle>{board.name}</CardTitle>
                  {board.description && (
                    <CardDescription>{board.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{board.columns.length} columns</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
