import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "@/lib/auth-options";
import { getServerSession } from "next-auth/next";

const prisma = new PrismaClient();

export async function DELETE(
  req: Request,
  { params }: { params: { boardId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }

    const { boardId } = params;  
    
    const board = await prisma.board.findUnique({
      where: { id: boardId },
    });

    if (!board) {
      return NextResponse.json(
        { error: "보드를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (board.authorId !== session.user.id) {
      return NextResponse.json(
        { error: "삭제 권한이 없습니다." },
        { status: 403 }
      );
    }

    await prisma.board.delete({
      where: { id: boardId },
    });

    return NextResponse.json({ message: "보드가 성공적으로 삭제되었습니다." });
  } catch (error) {
    console.error("보드 삭제 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { boardId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }

    const { boardId } = params;
    const { title } = await req.json();

    const board = await prisma.board.findUnique({
      where: { id: boardId },
    });

    if (!board) {
      return NextResponse.json(
        { error: "보드를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (board.authorId !== session.user.id) {
      return NextResponse.json(
        { error: "수정 권한이 없습니다." },
        { status: 403 }
      );
    }

    await prisma.board.update({
      where: { id: boardId },
      data: { title },
    });

    return NextResponse.json({ message: "보드 제목이 성공적으로 수정되었습니다." });
  } catch (error) {
    console.error("보드 수정 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(
  req: Request,
  { params }: { params: { boardId: string } }
) {
  try {
    const { boardId } = params;

    const board = await prisma.board.findUnique({
      where: { id: boardId },
    });

    if (!board) {
      return NextResponse.json(
        { error: "보드를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json(board);
  } catch (error) {
    console.error("보드 가져오기 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}