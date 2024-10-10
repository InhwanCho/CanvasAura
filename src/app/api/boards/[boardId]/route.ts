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

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }

    const { boardId, path, color, userId, bounds, id } = await req.json();
    
    // path는 좌표 배열이므로 배열인지 확인
    if (!Array.isArray(path)) {
      return NextResponse.json({ error: 'path 필드는 좌표 배열이어야 합니다.' }, { status: 400 });
    }

    // bounds는 객체여야 함
    if (!bounds || typeof bounds.x !== 'number' || typeof bounds.y !== 'number' || typeof bounds.width !== 'number' || typeof bounds.height !== 'number') {
      return NextResponse.json({ error: '유효하지 않은 bounds 값입니다.' }, { status: 400 });
    }

    // userId가 유효한지 확인
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: '유효하지 않은 사용자입니다.' }, { status: 400 });
    }

    let drawHistory;

    if (id) {
      // 이미 존재하는 기록을 업데이트 (redo의 경우)
      drawHistory = await prisma.drawHistory.update({
        where: { id },
        data: {
          path,
          color,
          bounds,
        },
      });
    } else {
      // 새 드로잉 기록을 DB에 저장
      drawHistory = await prisma.drawHistory.create({
        data: {
          boardId,
          path,   // path는 JSON으로 저장
          color,
          userId,
          bounds, // bounds 값을 저장
        },
      });
    }

    return NextResponse.json(drawHistory);
  } catch (error) {
    console.error('그림 저장 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
