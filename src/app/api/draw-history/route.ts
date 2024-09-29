import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }

    const { boardId, path, color, userId } = await req.json();
    console.log(userId);

    // userId가 유효한지 확인
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: '유효하지 않은 사용자입니다.' }, { status: 400 });
    }

    const drawHistory = await prisma.drawHistory.create({
      data: {
        boardId,
        path,
        color,
        userId,
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