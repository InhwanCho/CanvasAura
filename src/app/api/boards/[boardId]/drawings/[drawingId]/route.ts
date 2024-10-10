import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { getServerSession } from "next-auth/next";

// DELETE 요청을 처리하는 함수 (drawingId를 URL 경로에서 받음)
export async function DELETE(
  req: Request,
  { params }: { params: { boardId: string; drawingId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }

    const { drawingId } = params;

    // 해당 drawingId가 존재하는지 확인
    const drawing = await prisma.drawHistory.findUnique({
      where: { id: drawingId },
    });

    if (!drawing) {
      return NextResponse.json(
        { error: "그리기 기록을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 그리기 기록 삭제
    await prisma.drawHistory.delete({
      where: { id: drawingId },
    });

    return NextResponse.json({ message: "그리기 기록이 성공적으로 삭제되었습니다." });
  } catch (error) {
    console.error("그리기 기록 삭제 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// PUT 요청을 처리하는 함수 (redo된 드로잉 기록 업데이트 또는 생성)
export async function PUT(
  req: Request,
  { params }: { params: { boardId: string; drawingId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }

    const { drawingId, boardId } = params;
    const updatedDrawData = await req.json();

    // 해당 drawingId가 존재하는지 확인
    let drawHistory = await prisma.drawHistory.findUnique({
      where: { id: drawingId },
    });

    if (drawHistory) {
      // 그리기 기록 업데이트
      drawHistory = await prisma.drawHistory.update({
        where: { id: drawingId },
        data: updatedDrawData,
      });
    } else {
      // 그리기 기록이 존재하지 않으면 새로 생성
      drawHistory = await prisma.drawHistory.create({
        data: {
          id: drawingId,
          boardId,
          ...updatedDrawData,
        },
      });
    }

    return NextResponse.json(drawHistory);
  } catch (error) {
    console.error("그리기 기록 업데이트 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
