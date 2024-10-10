import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }

    const { boardId, path, color, userId, bounds } = await req.json();
    
    // path와 bounds를 JSON으로 전달
    if (!Array.isArray(path)) {
      return NextResponse.json({ error: 'path 필드는 좌표 배열이어야 합니다.' }, { status: 400 });
    }

    // userId가 유효한지 확인
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: '유효하지 않은 사용자입니다.' }, { status: 400 });
    }

    // 그리기 기록을 DB에 저장
    const drawHistory = await prisma.drawHistory.create({
      data: {
        boardId,
        path,   // path는 JSON으로 저장
        color,
        userId,
        bounds, // 새롭게 추가된 bounds 정보 저장
      },
    });

    return NextResponse.json(drawHistory);
  } catch (error) {
    console.error('그림 저장 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
