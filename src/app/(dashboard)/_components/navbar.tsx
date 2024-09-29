/* eslint-disable @next/next/no-img-element */
'use client'
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import SearchInput from "./search-input";
import ConfirmModal from "@/components/confirm-modal";
import ImageSelectionModal from "./image-selection-modal";

export function Navbar() {
  const { data: session, update } = useSession();
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const handleSignOut = () => {
    signOut({ redirect: false });
    toast.success('로그아웃 성공');
  };

  const handleImageClick = () => {
    setIsImageModalOpen(true);
  };

  const handleImageSelect = async (imageUrl: string) => {
    try {
      const response = await fetch('/api/user/update-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '이미지 업데이트에 실패했습니다.');
      }
  
      const data = await response.json();
      console.log('서버 응답:', data);
  
      // 새로운 JWT 저장
      if (data.token) {
        localStorage.setItem('jwt', data.token);
      }
  
      // 세션 업데이트
      await update();
  
      toast.success('프로필 이미지가 업데이트되었습니다.');
    } catch (error) {
      console.error('이미지 업데이트 오류:', error);
      toast.error('이미지 업데이트에 실패했습니다.');
    } finally {
      setIsImageModalOpen(false);
    }
  };

  return (
    <header className="z-10 sticky top-0 w-full bg-white bg-background/95 dark:bg-background/95 shadow-sm px-6">
      <div className="container flex h-16 items-center justify-between max-w-screen-xl mx-auto">
        <Link href={'/'}>
          <div className='flex items-center gap-x-2'>
            <img src={'/logo.svg'} alt='logo' height={45} width={45} />
            <span className={cn('font-semibold text-lg lg:text-2xl')}>
              CanvasAura
            </span>
          </div>
        </Link>        
        <SearchInput />
        {session?.user ? (
          <div className="flex items-center gap-4">
            {(session.user?.image || localStorage.getItem('jwt')) && (
              <img
                src={(() => {
                  const jwt = localStorage.getItem('jwt');
                  if (jwt) {
                    try {
                      const payload = JSON.parse(atob(jwt.split('.')[1]));
                      return payload.image || session.user?.image;
                    } catch (error) {
                      console.error('JWT 디코딩 오류:', error);
                      return session.user?.image;
                    }
                  }
                  return session.user?.image;
                })()}
                alt="사용자"
                height={45}
                width={45}
                className="rounded-full border-[1.5px] border-gray-300 cursor-pointer"
                onClick={handleImageClick}
              />
            )}
            <ConfirmModal header="정말로 로그아웃 하시겠습니까?" onConfirm={handleSignOut}>
              <Button variant="outline">로그아웃</Button>
            </ConfirmModal>
          </div>
        ) : (
          <Link href="/auth/signin">
            <Button variant="outline">로그인</Button>
          </Link>
        )}
      </div>
      <ImageSelectionModal 
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        onSelect={handleImageSelect}
      />
    </header>
  );
}