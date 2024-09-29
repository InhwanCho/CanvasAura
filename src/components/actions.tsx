'use client'

import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Link, Pencil, Trash } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import ConfirmModal from './confirm-modal';
import TitleEditModal from './title-edit-modal';

interface ActionsProps {
  id: string;
  title: string;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
}

export function Actions({ id, title, children, side = "bottom", sideOffset = 0 }: ActionsProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  const onCopy = () => {
    navigator.clipboard.writeText(window.location.origin + "/board/" + id);
    toast.success("보드 링크가 복사되었습니다.");
  };

  const onDelete = async () => {
    try {
      const response = await fetch(`/api/boards/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '보드 삭제에 실패했습니다.');
      }
      toast.success("보드가 삭제되었습니다.");      
      window.location.href = '/';
      // window.location.reload()
    } catch (error) {
      console.error('삭제 오류:', error);
      toast.error(error instanceof Error ? error.message : "보드 삭제에 실패했습니다.");
    }
  };

    const onEdit = async (newTitle: string) => {
    try {
      const response = await fetch(`/api/boards/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      });
      if (!response.ok) throw new Error('제목 수정에 실패했습니다.');
      toast.success("제목이 수정되었습니다.");
      router.push(window.location.pathname);
      // window.location.reload()
      setIsEditing(false);
    } catch (error) {
      toast.error("제목 수정에 실패했습니다." + error);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {children}
        </DropdownMenuTrigger>
        <DropdownMenuContent sideOffset={sideOffset} side={side} align="start" className="w-60">
          <DropdownMenuItem onClick={onCopy} className="p-3 cursor-pointer">
            <Link className="h-4 w-4 mr-2" />
            링크 복사
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsEditing(true)} className="p-3 cursor-pointer">
            <Pencil className="h-4 w-4 mr-2" />
            제목 수정
          </DropdownMenuItem>
          <ConfirmModal
            header="정말로 삭제하시겠습니까?"
            description="이 작업은 되돌릴 수 없습니다."
            onConfirm={onDelete}
          >
            <Button variant="ghost" className="p-3 cursor-pointer text-sm w-full justify-start font-normal">
              <Trash className="h-4 w-4 mr-2" />
              삭제
            </Button>
          </ConfirmModal>
        </DropdownMenuContent>
      </DropdownMenu>
      <TitleEditModal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        onSave={onEdit}
        initialTitle={title}
      />
    </>
  );
}