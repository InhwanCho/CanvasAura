/* eslint-disable @next/next/no-img-element */
'use client'
import { Card, CardContent } from "@/components/ui/card";
import { board } from "@prisma/client";
import Link from "next/link";
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { MoreVertical } from "lucide-react";
import { Actions } from "@/components/actions";

interface BoardCardProps {
  board: board;
}

export function BoardCard({ board }: BoardCardProps) {
  return (
    <Card className="group relative hover:shadow-md transition">
      <Link href={`/board/${board.id}`}>
        <CardContent className="p-0">
          <div className="relative w-full h-40">
            <img
              src={board.imageUrl}
              alt={board.title}
              className="absolute inset-0 object-fill w-full h-full p-4 "
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity rounded-t-lg" />
          </div>
          <div className="p-3">
            <h3 className="text-lg font-semibold">{board.title}</h3>
            <p className="text-sm text-muted-foreground">
              작성자: {board.authorName}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {formatDistanceToNow(new Date(board.updatedAt), { addSuffix: true, locale: ko })} 업데이트
            </p>
          </div>
        </CardContent>
      </Link>
      <div className="absolute top-2 right-2">
        <Actions
          side="right"
          sideOffset={9}
          id={board.id}
          title={board.title}
        >
          <button className="p-1.5 bg-white rounded-full shadow-sm focus:outline-none">
            <MoreVertical className="h-4 w-4 text-gray-500" />
          </button>
        </Actions>
      </div>
    </Card>
  );
}
