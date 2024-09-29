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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const boardId = searchParams.get('boardId');

    if (!boardId) {
      return NextResponse.json({ error: 'boardId가 필요합니다.' }, { status: 400 });
    }

    const drawHistory = await prisma.drawHistory.findMany({
      where: { boardId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(drawHistory);
  } catch (error) {
    console.error('그림 히스토리 로딩 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}