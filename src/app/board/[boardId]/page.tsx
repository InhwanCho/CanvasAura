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
import {
  DrawHistory,
  Camera,
  CanvasState,
  CanvasMode,
  Point,
  Side,
  XYWH
} from '@/types/draw-types';
import { SelectionBox } from './_components/selection-box';

export default function BoardPage() {
  const { data: sessionData, status } = useSession();
  const session = sessionData as Session | null;
  const params = useParams();
  const router = useRouter();
  const [drawHistory, setDrawHistory] = useState<DrawHistory[]>([]);
  const [userDrawHistory, setUserDrawHistory] = useState<{ [userId: string]: DrawHistory[] }>({});
  const [userRedoHistory, setUserRedoHistory] = useState<{ [userId: string]: DrawHistory[] }>({});
  const [canvasState, setCanvasState] = useState<CanvasState>({ mode: CanvasMode.None });
  const [path, setPath] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false); // 물체를 드래그 중인지 확인
  const [dragStart, setDragStart] = useState<Point | null>(null); // 드래그 시작 시점 좌표
  const [dragOffset, setDragOffset] = useState<Point | null>(null); // 물체의 원래 위치 오프셋

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

    fetch(`/api/boards/${params.boardId}`)
      .then(response => response.json())
      .then(data => {
        setDrawHistory(data.drawHistory);
        console.log('서버로부터 받은 드로잉 기록:', data.drawHistory);
      })
      .catch(error => {
        console.error('그리기 기록 불러오기 실패:', error);
      });

    socket.emit('join-board', { boardId: params.boardId, userId: session?.user?.id ?? '' });

    socket.on('canvas-state-from-server', (state: DrawHistory[]) => {
      console.log('서버로부터 받은 보드 상태:', state);
      setDrawHistory(state);
    });

    return () => {
      socket.off('canvas-state-from-server');
      socket.disconnect();
    };
  }, [session, status, params.boardId, router]);

  useEffect(() => {
    setUserDrawHistory({});
    setUserRedoHistory({});
  }, [params.boardId]);

  const onWheel = useCallback((e: React.WheelEvent) => {
    setCamera((camera) => ({
      x: camera.x - e.deltaX, y: camera.y - e.deltaY
    }));
  }, []);

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

    fetch(`/api/boards/${params.boardId}/drawings/${lastDraw.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    }).then(response => {
      if (!response.ok) {
        console.error('그리기 기록 삭제 실패:', response.statusText);
      }
    }).catch(error => {
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
    if (canvasState.mode !== CanvasMode.Pencil) return;  // Pencil 모드일 때만 실행
    setIsDrawing(true);
    const svg = svgRef.current;
    if (!svg) return;

    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const transformedPoint = point.matrixTransform(svg.getScreenCTM()?.inverse());

    setPath([{ x: transformedPoint.x - camera.x, y: transformedPoint.y - camera.y }]);
  };

  const draw = (event: React.PointerEvent<SVGSVGElement>) => {
    if (isDrawing && canvasState.mode === CanvasMode.Pencil) {
      const svg = svgRef.current;
      if (!svg) return;

      const point = svg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      const transformedPoint = point.matrixTransform(svg.getScreenCTM()?.inverse());

      setPath(prevPath => [...prevPath, { x: transformedPoint.x - camera.x, y: transformedPoint.y - camera.y }]);
    }
  };

  const stopDrawing = () => {
    if (!session || !isDrawing) return;
    if (canvasState.mode !== CanvasMode.Pencil) return;

    if (path.length > 0) {
      const minX = Math.min(...path.map(p => p.x));
      const minY = Math.min(...path.map(p => p.y));
      const maxX = Math.max(...path.map(p => p.x));
      const maxY = Math.max(...path.map(p => p.y));

      const newDraw = {
        path,
        color,
        boardId: params.boardId as string,
        userId: session?.user?.id || '',
        createdAt: new Date(),
        bounds: {
          x: minX,
          y: minY,
          width: maxX - minX, // 정확한 width 계산
          height: maxY - minY, // 정확한 height 계산
        },
      };

      fetch(`/api/boards/${params.boardId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newDraw),
      })
        .then(response => response.json())
        .then(data => {
          setDrawHistory(prev => [...prev, { ...newDraw, id: data.id }]);
          setUserDrawHistory(prev => ({
            ...prev,
            [session.user.id]: [...(prev[session.user.id] || []), { ...newDraw, id: data.id }],
          }));
          setUserRedoHistory(prev => ({ ...prev, [session.user.id]: [] }));
        })
        .catch(error => {
          console.error('그리기 기록 저장 실패:', error);
        });
    }

    setPath([]);
    setIsDrawing(false);
  };

  const handlePointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;

    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const transformedPoint = point.matrixTransform(svg.getScreenCTM()?.inverse());

    if (canvasState.mode === CanvasMode.None) {
      // 클릭된 위치에 있는 레이어를 찾음
      const clickedLayers = drawHistory.filter((layer) => {
        const { x, y, width, height } = layer.bounds;
        return (
          transformedPoint.x >= x &&
          transformedPoint.x <= x + width &&
          transformedPoint.y >= y &&
          transformedPoint.y <= y + height
        );
      });

      if (clickedLayers.length > 0) {
        // 클릭된 물체를 선택
        setSelectedLayerIds([clickedLayers[0].id]);

        // 드래그 시작 지점 기록
        setDragStart({ x: transformedPoint.x, y: transformedPoint.y });

        // 선택된 물체의 원래 위치 오프셋 기록
        const selectedLayer = clickedLayers[0];
        if (selectedLayer) {
          setDragOffset({ x: selectedLayer.bounds.x, y: selectedLayer.bounds.y });
        }

        setCanvasState({ mode: CanvasMode.Translating, current: transformedPoint }); // 물체 이동 모드로 변경
        setIsDragging(true);  // 드래그가 시작됨
      } else {
        // 드래그로 선택 영역을 설정하기 위해 초기화
        setSelectedLayerIds([]);
        setCanvasState({
          mode: CanvasMode.SelectionNet,
          origin: { x: transformedPoint.x - camera.x, y: transformedPoint.y - camera.y },
          current: { x: transformedPoint.x - camera.x, y: transformedPoint.y - camera.y }
        });
      }
    } else if (canvasState.mode === CanvasMode.Pencil) {
      startDrawing(event);  // Pencil 모드일 때 드로잉 시작
    }
  };

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
  
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const transformedPoint = point.matrixTransform(svg.getScreenCTM()?.inverse());
  
    if (isDragging && canvasState.mode === CanvasMode.Translating && dragStart) {
      // 이동 거리 계산
      const deltaX = transformedPoint.x - dragStart.x;
      const deltaY = transformedPoint.y - dragStart.y;
  
      // 선택된 물체의 좌표를 업데이트 (path와 bounds를 모두 업데이트)
      setDrawHistory((prev) =>
        prev.map((layer) => {
          if (selectedLayerIds.includes(layer.id)) {
            if (layer.path) {
              // path가 있는 물체일 경우, path 좌표도 이동
              const movedPath = layer.path.map((p) => ({
                x: p.x + deltaX,
                y: p.y + deltaY,
              }));
              return {
                ...layer,
                path: movedPath, // path 좌표 업데이트
                bounds: {
                  ...layer.bounds,
                  x: layer.bounds.x + deltaX,
                  y: layer.bounds.y + deltaY,
                },
              };
            } else {
              // bounds만 업데이트되는 물체 (Rectangle, Ellipse 등)
              return {
                ...layer,
                bounds: {
                  ...layer.bounds,
                  x: layer.bounds.x + deltaX,
                  y: layer.bounds.y + deltaY,
                },
              };
            }
          }
          return layer;
        })
      );
  
      // 드래그 시작점을 갱신하여 매번 업데이트된 위치를 기준으로 이동
      setDragStart({ x: transformedPoint.x, y: transformedPoint.y });
    } else if (canvasState.mode === CanvasMode.SelectionNet && canvasState.origin) {
      setIsDragging(true);
      setCanvasState((prevState) => ({
        ...prevState,
        current: { x: transformedPoint.x - camera.x, y: transformedPoint.y - camera.y },
      }));
    } else if (canvasState.mode === CanvasMode.Pencil) {
      draw(event); // Pencil 모드일 때 드로잉 처리
    }
  };
  
  // PointerUp에서 드래그 종료
  const handlePointerUp = (event: React.PointerEvent<SVGSVGElement>) => {
    if (canvasState.mode === CanvasMode.Pencil && isDrawing) {
      stopDrawing(); // 마우스를 떼면 드로잉을 멈춤
    }
  
    if (isDragging && canvasState.mode === CanvasMode.Translating) {      
      // 물체 이동이 완료되면 드래그 상태 초기화
      setIsDragging(false);
      setDragStart(null);
      setDragOffset(null);
      setCanvasState({ mode: CanvasMode.None });  // 이동 후 기본 모드로 전환
    }

    if (isDragging && canvasState.mode === CanvasMode.SelectionNet && canvasState.origin && canvasState.current) {
      // 드래그일 때만 선택 네트로 선택 영역을 계산
      const xMin = Math.min(canvasState.origin.x, canvasState.current.x);
      const xMax = Math.max(canvasState.origin.x, canvasState.current.x);
      const yMin = Math.min(canvasState.origin.y, canvasState.current.y);
      const yMax = Math.max(canvasState.origin.y, canvasState.current.y);

      // 선택 영역 내에 있는 레이어들을 필터링
      const selectedLayers = drawHistory.filter((layer) => {
        const { x, y, width, height } = layer.bounds;

        // 물체의 bounds와 선택 영역의 교차 영역 계산
        const intersectXMin = Math.max(x, xMin);
        const intersectYMin = Math.max(y, yMin);
        const intersectXMax = Math.min(x + width, xMax);
        const intersectYMax = Math.min(y + height, yMax);

        // 교차 영역의 너비와 높이
        const intersectWidth = Math.max(0, intersectXMax - intersectXMin);
        const intersectHeight = Math.max(0, intersectYMax - intersectYMin);

        // 교차 영역의 면적
        const intersectionArea = intersectWidth * intersectHeight;

        // 물체의 전체 영역 면적
        const objectArea = width * height;

        // 교차 영역이 물체의 55% 이상인 경우 선택
        const isMostlyContained = (intersectionArea / objectArea) >= 0.55;

        return isMostlyContained;
      });

      // 선택된 레이어 업데이트
      setSelectedLayerIds(selectedLayers.slice(0, 5).map(layer => layer.id));
      setCanvasState({ mode: CanvasMode.None });  // 선택 완료 후 모드 변경
    }

    setIsDragging(false);  // 드래그가 끝났으므로 상태 초기화
  };


  const onResizeHandlePointerDown = useCallback((
    corner: Side, initialBounds: XYWH
  ) => {
    setCanvasState({
      mode: CanvasMode.Resizing,
      initialBounds,
      corner
    });
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
        canUndo={(userDrawHistory[session?.user?.id ?? ''] || []).length > 0}
        canRedo={(userRedoHistory[session?.user?.id ?? ''] || []).length > 0}
      />
      <svg
        ref={svgRef}
        className="h-full w-full"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={onWheel}
      >
        <g style={{ transform: `translate(${camera.x}px, ${camera.y}px)` }}>
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
          {selectedLayerIds.length > 0 && (
            selectedLayerIds.map(selectedLayerId => {
              return (
                <SelectionBox
                  key={selectedLayerId}
                  selectedLayerId={selectedLayerId}
                  layers={new Map(drawHistory.map(draw => [draw.id, draw]))}
                  onResizeHandlePointerDown={onResizeHandlePointerDown}
                />
              );
            })
          )}

          {canvasState.mode === CanvasMode.SelectionNet && canvasState.current && canvasState.origin && (
            <rect className="fill-blue-500/5 stroke-blue-500 stroke-1"
              x={Math.min(canvasState.origin.x, canvasState.current.x)}
              y={Math.min(canvasState.origin.y, canvasState.current.y)}
              width={Math.abs(canvasState.origin.x - canvasState.current.x)}
              height={Math.abs(canvasState.origin.y - canvasState.current.y)} />
          )}
        </g>
      </svg>
    </main>
  );
}
