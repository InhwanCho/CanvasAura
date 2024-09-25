import { validatePassword } from '@/lib/utils';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { readdirSync } from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return new Response(JSON.stringify({ message: "모든 필드를 입력해주세요." }), { status: 400 });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return new Response(JSON.stringify({ message: passwordError }), { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return new Response(JSON.stringify({ message: "이미 존재하는 이메일입니다." }), { status: 400 });
    }

    // 랜덤 이미지 선택
    const charactersDir = path.join(process.cwd(), 'public', 'characters');
    const images = readdirSync(charactersDir);
    const randomImage = images[Math.floor(Math.random() * images.length)];
    const imageUrl = `/characters/${randomImage}`;

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name: name,
        email,
        password: hashedPassword,
        imageUrl: imageUrl,
      },
    });

    return new Response(JSON.stringify({ message: "회원가입이 완료되었습니다.", user: { id: user.id, name: user.name, email: user.email, imageUrl: user.imageUrl } }), { status: 201 });
  } catch (error) {
    console.error("회원가입 에러:", error);
    return new Response(JSON.stringify({ message: "서버 오류가 발생했습니다." }), { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}