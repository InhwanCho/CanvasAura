'use client';

import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function CreateBoard() {
  const [title, setTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const handleCreate = async () => {
    if (!title) {
      toast.error('보드 제목을 입력해주세요.');
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });

      if (!response.ok) {
        throw new Error('보드 생성에 실패했습니다.');
      }

      toast.success('보드가 생성되었습니다.');
      router.refresh(); // 대시보드 새로고침
      setTitle('');
    } catch (error) {
      toast.error('보드 생성 중 오류가 발생했습니다.' + error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="hover:opacity-75 transition border-dashed border-2 cursor-pointer">
      <CardContent className="flex flex-col items-center justify-center py-8">
        <Plus className="h-12 w-12 text-muted-foreground mb-2" />
        <p className="text-sm font-medium text-muted-foreground mb-2">새 보드 만들기</p>
        <Input
          type="text"
          placeholder="보드 제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mb-2"
        />
        <Button onClick={handleCreate} disabled={isCreating}>
          {isCreating ? '생성 중...' : '생성하기'}
        </Button>
      </CardContent>
    </Card>
  );
}