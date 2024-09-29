'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Info } from './_components/info';
import Participants from './_components/participants';
import { useParams } from 'next/navigation';
import Toolbar from './_components/toolbar';
import { io, Socket } from 'socket.io-client';
import { SketchPicker } from 'react-color';

interface Point {
  x: number;
  y: number;
}

interface DrawHistory {
  path: string;
  color: string;
  userId: string;
}

export default function BoardPage() {
  const params = useParams();
  const [userId, setUserId] = useState<string>('');
  const [color, setColor] = useState<string>('#000');
  const [isDrawing, setIsDrawing] = useState(false);
  const [path, setPath] = useState<string>('');
  const [canvasState, setCanvasState] = useState<'select' | 'draw'>('select');
  const [drawHistory, setDrawHistory] = useState<DrawHistory[]>([]);
  const [userDrawHistory, setUserDrawHistory] = useState<DrawHistory[]>([]);
  const [redoHistory, setRedoHistory] = useState<DrawHistory[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket: Socket = io('http://localhost:3001', {
      query: { boardId: params.boardId }
    });
    socketRef.current = socket;

    socket.emit('client-ready', params.boardId);
    // 사용자 ID 생성 및 설정
    const generatedUserId = Math.random().toString(36).substr(2, 9);
    setUserId(generatedUserId);

    socket.on('get-canvas-state', () => {
      socket.emit('canvas-state', drawHistory);
    });

    socket.on('canvas-state-from-server', (state: DrawHistory[]) => {
      setDrawHistory(state);
    });

    socket.on('draw-line', ({ prevPoint, currentPoint, color, userId: drawUserId }) => {
      setDrawHistory(prev => [...prev, { path: `M ${prevPoint.x} ${prevPoint.y} L ${currentPoint.x} ${currentPoint.y}`, color, userId: drawUserId }]);
    });

    socket.on('clear', () => {
      setDrawHistory([]);
      setUserDrawHistory([]);
      setRedoHistory([]);
    });

    return () => {
      socket.disconnect();
    };
  }, [params.boardId]);

  const startDrawing = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (canvasState !== 'draw') return;
    const point = getMousePosition(event);
    setPath(`M ${point.x} ${point.y}`);
    setIsDrawing(true);
  }, [canvasState]);

  const draw = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing || canvasState !== 'draw') return;
    const point = getMousePosition(event);
    setPath(prevPath => `${prevPath} L ${point.x} ${point.y}`);
    socketRef.current?.emit('draw-line', { prevPoint: getMousePosition(event), currentPoint: point, color, userId });
  }, [isDrawing, canvasState, color, userId]);

  const stopDrawing = useCallback(() => {
    if (isDrawing && path) {
      const newDraw = { path, color, userId };
      setDrawHistory(prev => [...prev, newDraw]);
      setUserDrawHistory(prev => [...prev, newDraw]);
      setRedoHistory([]);
      socketRef.current?.emit('canvas-state', [...drawHistory, newDraw]);
    }
    setIsDrawing(false);
  }, [isDrawing, path, color, userId, drawHistory]);

  const getMousePosition = (event: React.MouseEvent<SVGSVGElement>): Point => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const CTM = svg.getScreenCTM();
    if (!CTM) return { x: 0, y: 0 };
    return {
      x: (event.clientX - CTM.e) / CTM.a,
      y: (event.clientY - CTM.f) / CTM.d
    };
  };

  const undo = useCallback(() => {
    if (userDrawHistory.length === 0) return;
    const lastDraw = userDrawHistory[userDrawHistory.length - 1];
    const newUserDrawHistory = userDrawHistory.slice(0, -1);
    setUserDrawHistory(newUserDrawHistory);
    setRedoHistory(prev => [...prev, lastDraw]);

    const newDrawHistory = drawHistory.filter(draw => !(draw.userId === userId && draw === lastDraw));
    setDrawHistory(newDrawHistory);
    socketRef.current?.emit('undo', { newDrawHistory, userId });
  }, [userDrawHistory, drawHistory, userId]);

  const redo = useCallback(() => {
    if (redoHistory.length === 0) return;
    const lastRedo = redoHistory[redoHistory.length - 1];
    const newRedoHistory = redoHistory.slice(0, -1);
    setRedoHistory(newRedoHistory);
    setUserDrawHistory(prev => [...prev, lastRedo]);
    setDrawHistory(prev => [...prev, lastRedo]);
    socketRef.current?.emit('redo', { newDrawHistory: [...drawHistory, lastRedo], userId });
  }, [redoHistory, drawHistory, userId]);

  return (
    <main className="h-screen w-full relative bg-neutral-100 touch-none">
      <Info boardId={params.boardId as string} />
      <Participants />
      <Toolbar
        canvasState={canvasState}
        setCanvasState={setCanvasState}
        undo={undo}
        redo={redo}
        canUndo={userDrawHistory.length > 0}
        canRedo={redoHistory.length > 0}
      />
      {/* <div className="absolute top-2 left-2">
        <SketchPicker
          color={color}
          onChangeComplete={(color) => setColor(color.hex)}
        />
      </div> */}
      <svg
        ref={svgRef}
        className='h-full w-full'
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      >
        {drawHistory.map((draw, index) => (
          <path key={index} d={draw.path} stroke={draw.color} strokeWidth="2" fill="none" />
        ))}
        {isDrawing && <path d={path} stroke={color} strokeWidth="2" fill="none" />}
      </svg>
    </main>
  );
}