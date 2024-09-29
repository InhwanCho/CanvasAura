import { Navbar } from "./_components/navbar";
import { CreateBoard } from "./_components/create-board";
import { PrismaClient } from '@prisma/client';
import { BoardCard } from "./_components/board-card";


const prisma = new PrismaClient();

export default async function Dashboard() {
  const boards = await prisma.board.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto p-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">대시보드</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          <CreateBoard />
          {boards.map((board) => (
            <BoardCard key={board.id} board={board} />
          ))}
        </div>
      </main>
    </div>
  );
}