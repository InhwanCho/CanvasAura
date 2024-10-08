import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { getServerSession } from "next-auth/next";

// GET 요청: 보드와 그리기 기록을 가져옵니다.
export async function GET(
  req: Request,
  { params }: { params: { boardId: string } }
) {
  try {
    const { boardId } = params;

    // 보드와 그리기 기록을 동시에 가져오기
    const [board, drawHistory] = await Promise.all([
      prisma.board.findUnique({ where: { id: boardId } }),
      prisma.drawHistory.findMany({ where: { boardId } })
    ]);

    if (!board) {
      return NextResponse.json(
        { error: "보드를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ board, drawHistory });
  } catch (error) {
    console.error("보드 가져오기 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(
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
    const { path, color, userId } = await req.json();

    // 그리기 기록 저장 (UUID 기반 drawingId는 Prisma가 자동으로 생성)
    const newDraw = await prisma.drawHistory.create({
      data: {
        boardId,
        userId,
        path,
        color,
      },
    });

    // 생성된 drawingId를 클라이언트에 반환
    return NextResponse.json(newDraw);
  } catch (error) {
    console.error("그리기 기록 저장 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
