'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const finalName = name ? name.trim() : randomName;

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: finalName, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '회원가입 중 오류가 발생했습니다.');
      }

      toast.success('회원가입이 완료되었습니다.');
      router.push('/auth/signin');
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const [randomName] = useState(() => `익명${Math.floor(10000 + Math.random() * 90000)}`);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-10 shadow-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">회원가입</h2>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <p className="text-center text-red-500">{error}</p>}
          <div className="rounded-md shadow-sm -space-y-px">
            <Input
              type="text"
              defaultValue={randomName}
              placeholder={`${randomName}(옵션)`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-t-md"
            />
            <Input
              type="email"
              placeholder="이메일 주소"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-none"
            />
            <Input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-b-md"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? '처리 중...' : '가입하기'}
          </Button>
        </form>
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            이미 계정이 있으신가요?{' '}
            <Link href="/auth/signin" className="font-medium text-blue-600 hover:text-blue-500">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}