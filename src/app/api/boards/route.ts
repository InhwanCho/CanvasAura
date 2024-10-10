import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }

    const { title } = await req.json();

    if (!title) {
      return NextResponse.json({ error: '제목이 필요합니다.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    const board = await prisma.board.create({
      data: {
        id: uuidv4(),
        title,
        orgId: 'default', // 실제 조직 ID로 변경해야 합니다
        authorId: user.id,
        authorName: user.name || '익명',
        imageUrl: '/logo.svg', // 기본 이미지 URL
      },
    });

    return NextResponse.json(board, { status: 201 });
  } catch (error) {
    console.error('보드 생성 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(req: Request, { params }: { params: { boardId: string } }) {
  try {
    const drawHistory = await prisma.drawHistory.findMany({
      where: { boardId: params.boardId },
    });
    return NextResponse.json(drawHistory);
  } catch (error) {
    console.error("그리기 기록 불러오기 오류:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
