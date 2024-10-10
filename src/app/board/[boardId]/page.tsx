'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Info from './_components/info';
import Participants from './_components/participants';
import Toolbar from './_components/toolbar';
import { toast } from 'sonner';
import { Session } from 'next-auth';

export interface PathPoint {
  x: number;
  y: number;
}

export interface DrawHistory {
  id: string;
  path: PathPoint[]; // 좌표 배열
  color: string;
  boardId: string;
  userId: string;
  createdAt: Date;
  bounds: { x: number; y: number; width: number; height: number }; // x, y, width, height를 포함하는 bounds 객체
}

export type Camera = {
  x: number;
  y: number;
};

export enum CanvasMode {
  None,
  Pressing,
  Translating, // 선택한 물체 이동 모드
  Pencil,
  Resizing,
  Inserting,
}

export default function BoardPage() {
  const { data: sessionData, status } = useSession();
  const session = sessionData as Session | null;
  const params = useParams();
  const router = useRouter();
  const [drawHistory, setDrawHistory] = useState<DrawHistory[]>([]);
  const [userDrawHistory, setUserDrawHistory] = useState<{ [userId: string]: DrawHistory[] }>({});
  const [userRedoHistory, setUserRedoHistory] = useState<{ [userId: string]: DrawHistory[] }>({});
  const [canvasState, setCanvasState] = useState<CanvasMode>(CanvasMode.None);
  const [path, setPath] = useState<PathPoint[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0 });
  const [selectedLayer, setSelectedLayer] = useState<DrawHistory | null>(null); // 선택한 레이어
  const svgRef = useRef<SVGSVGElement | null>(null);
  const socketRef = useRef<Socket | null>(null);

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

    // 서버에서 기존 보드 상태 불러오기
    fetch(`/api/boards/${params.boardId}`)
      .then(response => response.json())
      .then(data => {
        setDrawHistory(data.drawHistory);
        console.log('서버로부터 받은 드로잉 기록:', data.drawHistory); // 디버깅용
      })
      .catch(error => {
        console.error('그리기 기록 불러오기 실패:', error);
      });

    socket.emit('join-board', { boardId: params.boardId, userId: session?.user?.id ?? '' });

    socket.on('canvas-state-from-server', (state: DrawHistory[]) => {
      console.log('서버로부터 받은 보드 상태:', state); // 디버깅용
      setDrawHistory(state); // 기존 드로잉 기록을 새로 받은 기록으로 교체
    });

    return () => {
      socket.off('canvas-state-from-server');
      socket.disconnect();
    };
  }, [session, status, params.boardId, router]);

  useEffect(() => {
    // 새로고침 시 undo/redo 히스토리 초기화
    setUserDrawHistory({});
    setUserRedoHistory({});
  }, [params.boardId]);

  const undo = useCallback(() => {
    if (!session?.user?.id) return;
    const userId = session?.user?.id ?? '';
    const currentUserDrawHistory = userDrawHistory[userId] || [];
    if (currentUserDrawHistory.length === 0) return;

    const lastDraw = currentUserDrawHistory[currentUserDrawHistory.length - 1];
    const newDrawHistory = drawHistory.filter(draw => draw.id !== lastDraw.id);

    setDrawHistory(newDrawHistory);
    setUserDrawHistory(prev => ({
      ...prev,
      [userId]: currentUserDrawHistory.slice(0, -1),
    }));
    setUserRedoHistory(prev => ({
      ...prev,
      [userId]: [...(prev[userId] || []), lastDraw],
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
  }, [drawHistory, userDrawHistory, params.boardId, session?.user?.id]);

  const redo = useCallback(() => {
    if (!session?.user?.id) return;
    const userId = session.user.id;
    const currentUserRedoHistory = userRedoHistory[userId] || [];
    if (currentUserRedoHistory.length === 0) return;
  
    const lastRedo = currentUserRedoHistory[currentUserRedoHistory.length - 1];
    setUserRedoHistory(prev => ({
      ...prev,
      [userId]: prev[userId].slice(0, -1),
    }));
    setDrawHistory(prev => [...prev, lastRedo]);
    setUserDrawHistory(prev => ({
      ...prev,
      [userId]: [...(prev[userId] || []), lastRedo],
    }));
  
    // 서버에 redo 기록 업데이트 요청
    fetch(`/api/boards/${params.boardId}/drawings/${lastRedo.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(lastRedo),
    }).then(response => {
      if (!response.ok) {
        console.error('redo 기록 저장 실패:', response.statusText);
      }
    }).catch(error => {
      console.error('redo 기록 저장 실패:', error);
    });
  
    if (socketRef.current) {
      socketRef.current.emit('redo', { boardId: params.boardId, userId });
    }
  }, [userRedoHistory, params.boardId, session?.user?.id]);
  
  
  const startDrawing = (event: React.PointerEvent<SVGSVGElement>) => {
    console.log('startDrawing 함수 호출됨'); // 디버깅용
    console.log('현재 모드:', canvasState); // 디버깅용
    if (canvasState !== CanvasMode.Pencil) return;

    setIsDrawing(true);
    const svg = svgRef.current;
    if (!svg) return;

    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const transformedPoint = point.matrixTransform(svg.getScreenCTM()?.inverse());

    console.log('드로잉 시작 지점:', transformedPoint); // 디버깅용
    setPath([{ x: transformedPoint.x, y: transformedPoint.y }]);
  };

  const draw = (event: React.PointerEvent<SVGSVGElement>) => {
    if (canvasState === CanvasMode.Pencil && isDrawing) {
      const svg = svgRef.current;
      if (!svg) return;

      const point = svg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      const transformedPoint = point.matrixTransform(svg.getScreenCTM()?.inverse());

      console.log('드로잉 중, 현재 점:', transformedPoint);
      setPath(prevPath => [...prevPath, { x: transformedPoint.x, y: transformedPoint.y }]);
    } else if (canvasState === CanvasMode.Translating) {
      translateObject(event);
    }
  };

  const stopDrawing = () => {
    if (!session) {
      toast.info('로그인이 필요합니다.');
      router.push('/');
      return;
    }
    console.log('stopDrawing 함수 호출됨'); // 디버깅용
    if (canvasState !== CanvasMode.Pencil || !isDrawing) return;

    if (path.length > 0) {
      const newDraw: Omit<DrawHistory, 'id'> = {
        path,
        color,
        boardId: params.boardId as string,
        userId: session?.user?.id || '',
        createdAt: new Date(),
        bounds: { x: path[0].x, y: path[0].y, width: 100, height: 100 }, // 임시로 bounds 설정
      };

      fetch(`/api/boards/${params.boardId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newDraw),
      }).then(response => response.json())
        .then(data => {
          setDrawHistory((prev: DrawHistory[]) => [...prev, { ...newDraw, id: data.id }]);
          setUserDrawHistory(prev => ({
            ...prev,
            [session.user.id]: [...(prev[session.user.id] || []), { ...newDraw, id: data.id }],
          }));
          setUserRedoHistory(prev => ({ ...prev, [session.user.id]: [] })); // 새로 그린 경우 redo 히스토리 초기화
        })
        .catch(error => {
          console.error('그리기 기록 저장 실패:', error);
        });
      setPath([]);
    }
    setIsDrawing(false);
  };

  const selectObject = (event: React.PointerEvent<SVGSVGElement>) => {
    console.log('selectObject 함수 호출됨');
    console.log('현재 모드:', canvasState);
    if (canvasState !== CanvasMode.None) return;

    const svg = svgRef.current;
    if (!svg) return;

    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const transformedPoint = point.matrixTransform(svg.getScreenCTM()?.inverse());

    console.log('선택한 지점:', transformedPoint);

    const selected = drawHistory.find(draw => {
      return (
        transformedPoint.x >= draw.bounds.x &&
        transformedPoint.x <= draw.bounds.x + draw.bounds.width &&
        transformedPoint.y >= draw.bounds.y &&
        transformedPoint.y <= draw.bounds.y + draw.bounds.height
      );
    });

    if (selected) {
      console.log('선택된 객체:', selected);
      setSelectedLayer(selected);
      setCanvasState(CanvasMode.Translating);
    }
  };

  const translateObject = useCallback((event: React.PointerEvent<SVGSVGElement>) => {
    console.log('translateObject 함수 호출됨');
    console.log('현재 모드:', canvasState);
    if (canvasState !== CanvasMode.Translating || !selectedLayer) return;

    const svg = svgRef.current;
    if (!svg) return;

    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const transformedPoint = point.matrixTransform(svg.getScreenCTM()?.inverse());

    const deltaX = transformedPoint.x - selectedLayer.bounds.x;
    const deltaY = transformedPoint.y - selectedLayer.bounds.y;

    const updatedLayer = {
      ...selectedLayer,
      bounds: {
        ...selectedLayer.bounds,
        x: selectedLayer.bounds.x + deltaX,
        y: selectedLayer.bounds.y + deltaY,
      }
    };

    setSelectedLayer(updatedLayer);
    setDrawHistory((prev: DrawHistory[]) => prev.map(layer => (layer.id === updatedLayer.id ? updatedLayer : layer)));
    setCanvasState(CanvasMode.None);
  }, [canvasState, selectedLayer]);

  return (
    <main className="h-screen w-full relative bg-neutral-100 touch-none">
      <Info boardId={params.boardId as string} />
      <Participants />
      <Toolbar
        canvasState={canvasState}
        setCanvasState={setCanvasState}
        undo={undo}
        redo={redo}
        canUndo={(userDrawHistory[session?.user?.id ?? ''] || []).length > 0}
        canRedo={(userRedoHistory[session?.user?.id ?? ''] || []).length > 0}
      />
      <svg
        ref={svgRef}
        className="h-full w-full"
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={stopDrawing}
        onMouseDown={selectObject} // 선택 모드 동작
        onWheel={event => setCamera({ x: camera.x + event.deltaX, y: camera.y + event.deltaY })}
        viewBox={`${camera.x} ${camera.y} 1200 1200`}
      >
        {drawHistory.map((draw, index) => (
          <path
            key={index}
            d={`M ${draw.path.map(p => `${p.x},${p.y}`).join(' ')}`}
            stroke={draw.color}
            strokeWidth="2"
            fill="none"
          />
        ))}
        {isDrawing && (
          <path
            d={`M ${path.map(p => `${p.x},${p.y}`).join(' ')}`}
            stroke={color}
            strokeWidth="2"
            fill="none"
          />
        )}
      </svg>
    </main>
  );
}