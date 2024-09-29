'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Info } from './_components/info';
import Participants from './_components/participants';
import { useParams } from 'next/navigation';
import Toolbar from './_components/toolbar';
import { io, Socket } from 'socket.io-client';

interface Point {
  x: number;
  y: number;
}

interface DrawHistory {
  path: string;
  color: string;
}

export default function BoardPage() {
  const params = useParams();
  const [color, setColor] = useState<string>('#000');
  const [isDrawing, setIsDrawing] = useState(false);
  const [path, setPath] = useState<string>('');
  const [canvasState, setCanvasState] = useState<'select' | 'draw'>('select');
  const [drawHistory, setDrawHistory] = useState<DrawHistory[]>([]);
  const [redoHistory, setRedoHistory] = useState<DrawHistory[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket: Socket = io('http://localhost:3001');
    socketRef.current = socket;

    socket.on('get-canvas-state', () => {
      socket.emit('canvas-state', drawHistory);
    });

    socket.on('canvas-state-from-server', (state: DrawHistory[]) => {
      setDrawHistory(state);
    });

    socket.on('draw-line', ({ prevPoint, currentPoint, color }) => {
      setDrawHistory(prev => [...prev, { path: `M ${prevPoint.x} ${prevPoint.y} L ${currentPoint.x} ${currentPoint.y}`, color }]);
    });

    socket.on('clear', () => {
      setDrawHistory([]);
      setRedoHistory([]);
    });

    socket.on('undo', (state: DrawHistory[]) => {
      setDrawHistory(state);
    });

    socket.on('redo', (state: DrawHistory[]) => {
      setDrawHistory(state);
    });

    return () => {
      socket.disconnect();
    };
  }, [drawHistory]);

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
    socketRef.current?.emit('draw-line', { prevPoint: getMousePosition(event), currentPoint: point, color });
  }, [isDrawing, canvasState, color]);

  const stopDrawing = useCallback(() => {
    if (isDrawing && path) {
      setDrawHistory(prev => [...prev, { path, color }]);
      setRedoHistory([]);
      socketRef.current?.emit('canvas-state', [...drawHistory, { path, color }]);
    }
    setIsDrawing(false);
  }, [isDrawing, path, color, drawHistory]);

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
    if (drawHistory.length === 0) return;
    const lastDraw = drawHistory[drawHistory.length - 1];
    const newDrawHistory = drawHistory.slice(0, -1);
    setDrawHistory(newDrawHistory);
    setRedoHistory(prev => [...prev, lastDraw]);
    socketRef.current?.emit('undo', newDrawHistory);
  }, [drawHistory]);

  const redo = useCallback(() => {
    if (redoHistory.length === 0) return;
    const lastRedo = redoHistory[redoHistory.length - 1];
    const newRedoHistory = redoHistory.slice(0, -1);
    setRedoHistory(newRedoHistory);
    setDrawHistory(prev => [...prev, lastRedo]);
    socketRef.current?.emit('redo', [...drawHistory, lastRedo]);
  }, [redoHistory, drawHistory]);

  return (
    <main className="h-screen w-full relative bg-neutral-100 touch-none">
      <Info boardId={params.boardId as string} />
      <Participants />
      <Toolbar
        canvasState={canvasState}
        setCanvasState={setCanvasState}
        undo={undo}
        redo={redo}
        canUndo={drawHistory.length > 0}
        canRedo={redoHistory.length > 0}
      />
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