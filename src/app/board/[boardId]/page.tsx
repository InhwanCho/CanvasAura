'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Info from './_components/info';
import Participants from './_components/participants';
import Toolbar from './_components/toolbar';
import { toast } from 'sonner';

export interface DrawHistory {
  id: string;
  path: string;
  color: string;
  boardId: string;
  userId: string;
  createdAt: Date;
}

export type Camera = {
  x: number;
  y: number;
};

export default function BoardPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const [userDrawHistories, setUserDrawHistories] = useState<Record<string, DrawHistory[]>>({});
  const [redoHistories, setRedoHistories] = useState<Record<string, DrawHistory[]>>({});
  const [drawHistory, setDrawHistory] = useState<DrawHistory[]>([]);
  const [canvasState, setCanvasState] = useState<'select' | 'draw'>('draw');
  const [isDrawing, setIsDrawing] = useState(false);
  const [path, setPath] = useState('');
  const [color, setColor] = useState('#000000');
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false); // 화면 이동 상태 관리
  const svgRef = useRef<SVGSVGElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const userId = session?.user?.id;

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      toast.info('로그인이 필요합니다.');
      router.push('/');
      return;
    }

    if (!params.boardId) return;

    const socket: Socket = io('http://localhost:3001', {
      query: { boardId: params.boardId }
    });
    socketRef.current = socket;

    

    // 서버로부터 초기 그리기 기록 불러오기
    fetch(`/api/boards/${params.boardId}`)
      .then(response => response.json())
      .then(data => {
        setDrawHistory(data.drawHistory); // 서버가 보낸 drawHistory를 설정
      })
      .catch(error => {
        console.error('그리기 기록 불러오기 실패:', error);
      });

    socket.emit('join-board', { boardId: params.boardId, userId });

    socket.on('canvas-state-from-server', (state: DrawHistory[]) => {
      console.log("서버로부터 받은 보드 상태:", state);
      setDrawHistory(state);
    });

    return () => {
      socket.off('canvas-state-from-server');
      socket.disconnect();
    };
  }, [session, status, userId, params.boardId, router]);

  const getUserHistory = useCallback(
    (histories: Record<string, DrawHistory[]>, userId?: string) => {
      if (!userId) return [];
      return histories[userId] || [];
    },
    []
  );

  const undo = useCallback(() => {
    if (!userId) return;
    const currentUserDrawHistory = getUserHistory(userDrawHistories, userId);
    if (currentUserDrawHistory.length === 0) return;
    const lastDraw = currentUserDrawHistory[currentUserDrawHistory.length - 1];
    const newUserDrawHistory = currentUserDrawHistory.slice(0, -1);

    setUserDrawHistories(prev => ({
      ...prev,
      [userId]: newUserDrawHistory
    }));
    setRedoHistories(prev => ({
      ...prev,
      [userId]: [...getUserHistory(redoHistories, userId), lastDraw]
    }));

    // 서버에 해당 기록 삭제 요청 (UUID 기반 id 사용)
    fetch(`/api/boards/${params.boardId}/drawings/${lastDraw.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(response => {
        if (!response.ok) {
          console.error('그리기 기록 삭제 실패:', response.statusText);
        }
      })
      .catch(error => {
        console.error('그리기 기록 삭제 실패:', error);
      });

    if (socketRef.current) {
      socketRef.current.emit('undo', { boardId: params.boardId, userId });
    }
  }, [userId, getUserHistory, params.boardId, userDrawHistories, redoHistories]);

  const redo = useCallback(() => {
    if (!userId) return;
    const currentRedoHistory = getUserHistory(redoHistories, userId);
    if (currentRedoHistory.length === 0) return;
    const lastRedo = currentRedoHistory[currentRedoHistory.length - 1];
    const newRedoHistory = currentRedoHistory.slice(0, -1);

    setRedoHistories(prev => ({
      ...prev,
      [userId]: newRedoHistory
    }));
    setUserDrawHistories(prev => ({
      ...prev,
      [userId]: [...getUserHistory(userDrawHistories, userId), lastRedo]
    }));

    if (socketRef.current) {
      socketRef.current.emit('redo', { boardId: params.boardId, userId });
    }
  }, [userId, getUserHistory, params.boardId, userDrawHistories, redoHistories]);

  const startDrawing = (event: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (canvasState === 'select') return;
    setIsDrawing(true);
    const svg = svgRef.current;
    if (!svg) return;

    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const transformedPoint = point.matrixTransform(svg.getScreenCTM()?.inverse());

    setPath(`M ${transformedPoint.x} ${transformedPoint.y}`);
  };

  const stopDrawing = () => {
    if (canvasState === 'select' || !isDrawing || !userId) return;
    if (path) {
      const newDraw = {
        path,
        color,
        boardId: params.boardId as string,
        userId,
        createdAt: new Date()
      };

      // 서버에 그리기 기록 저장
      fetch(`/api/boards/${params.boardId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newDraw),
      })
        .then(response => response.json())
        .then(data => {
          // 서버로부터 받은 UUID 기반 id 사용
          const newDrawWithId = { ...newDraw, id: data.id };

          setUserDrawHistories(prev => ({
            ...prev,
            [userId]: [...getUserHistory(userDrawHistories, userId), newDrawWithId]
          }));
          setDrawHistory(prev => [...prev, newDrawWithId]);
        })
        .catch(error => {
          console.error('그리기 기록 저장 실패:', error);
        });

      if (socketRef.current) {
        socketRef.current.emit('draw', { boardId: params.boardId, userId, path, color });
      }
      setPath('');
    }
    setIsDrawing(false);
  };

  const draw = (event: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (canvasState === 'select' || !isDrawing) return;

    const svg = svgRef.current;
    if (!svg) return;

    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const transformedPoint = point.matrixTransform(svg.getScreenCTM()?.inverse());

    setPath(prevPath => `${prevPath} L ${transformedPoint.x} ${transformedPoint.y}`);
  };

  // 두 손가락으로 스크롤(이동) 또는 마우스 휠로 이동
  const onWheel = useCallback((e: React.WheelEvent) => {
    const smoothFactor = 0.5; // 이동을 더 부드럽게 하기 위한 배율
    setCamera((camera) => ({
      x: camera.x + e.deltaX * smoothFactor, // 좌우 이동 방향 수정
      y: camera.y + e.deltaY * smoothFactor  // 상하 이동
    }));
  }, []);

  // 마우스 이동에 대한 동작 설정 (드로잉 중일 때는 동작하지 않음)
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (isPanning && !isDrawing) {
      const smoothFactor = 0.3; // 부드러운 이동을 위한 감속 배율
      setCamera((camera) => ({
        ...camera,
        x: camera.x - e.movementX * smoothFactor,  // 좌우 이동 방향 수정
        y: camera.y - e.movementY * smoothFactor   // 상하 이동
      }));
    }
  }, [isPanning, isDrawing]);

  // 마우스 클릭 및 터치 시작 시
  const handlePointerDown = useCallback(() => {
    setIsPanning(true);
  }, []);

  // 마우스 클릭 및 터치 종료 시
  const handlePointerUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  return (
    <main className="h-screen w-full relative bg-neutral-100 touch-none">
      <Info boardId={params.boardId as string} />
      <Participants />
      <Toolbar
        canvasState={canvasState}
        setCanvasState={setCanvasState}
        undo={undo}
        redo={redo}
        canUndo={getUserHistory(userDrawHistories, userId).length > 0}
        canRedo={getUserHistory(redoHistories, userId).length > 0}
      />
      <svg
        ref={svgRef}
        className="h-full w-full"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={handlePointerUp} // 마우스가 캔버스를 벗어났을 때 이동 멈춤
        onWheel={onWheel} // 휠 스크롤로 화면 이동
        viewBox={`${camera.x} ${camera.y} 1200 1200`}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        {drawHistory.map((draw, index) => (
          <path key={index} d={draw.path} stroke={draw.color} strokeWidth="2" fill="none" />
        ))}
        {isDrawing && <path d={path} stroke={color} strokeWidth="2" fill="none" />}
      </svg>
    </main>
  );
}