'use client';


import { LayerType, Side, XYWH } from "@/types/draw-types";
import { useState, useEffect } from "react";

import { memo } from "react";

// Layer 타입을 관리할 수 있는 전역 상태 또는 컨텍스트 설정이 필요합니다. 예시로 useState를 사용합니다.
const HANDLE_WIDTH = 8;

interface SelectionBoxProps {
  selectedLayerId: string | null; // 선택된 Layer의 ID를 prop으로 받음
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  layers: Map<string, any>; // 모든 layer 정보가 담긴 map (ID를 키로 사용)
  onResizeHandlePointerDown: (corner: Side, initiailBounds: XYWH) => void;
}

export const SelectionBox = memo(({
  selectedLayerId,
  layers,
  onResizeHandlePointerDown,
}: SelectionBoxProps) => {

  // Layer 정보가 존재하면 해당 Layer의 bounds를 가져옵니다.
  const selectedLayer = selectedLayerId ? layers.get(selectedLayerId) : null;

  const [bounds, setBounds] = useState<XYWH | null>(null);
  const [isShowingHandles, setIsShowingHandles] = useState(false);

  // 선택된 Layer의 bounds 값을 업데이트하는 로직
  useEffect(() => {
    if (selectedLayer) {
      setBounds({
        x: selectedLayer.x,
        y: selectedLayer.y,
        width: selectedLayer.width,
        height: selectedLayer.height,
      });
      setIsShowingHandles(selectedLayer.type !== LayerType.Path);
    } else {
      setBounds(null);
      setIsShowingHandles(false);
    }
  }, [selectedLayer]);

  if (!bounds) {
    return null;
  }

  return (
    <>
      <rect className="fill-transparent stroke-blue-500 stroke-1 pointer-events-none"
        style={{ transform: `translate(${bounds.x}px, ${bounds.y}px)` }}
        x={0} y={0}
        width={bounds.width}
        height={bounds.height}
      />
      {isShowingHandles && (
        <>
          <rect className="fill-white stroke-1 stroke-blue-500" x={0} y={0} style={{
            cursor: "nwse-resize",
            width: `${HANDLE_WIDTH}px`,
            height: `${HANDLE_WIDTH}px`,
            transform: `translate(${bounds.x - HANDLE_WIDTH / 2}px, ${bounds.y - HANDLE_WIDTH / 2}px)`,
          }}
            onPointerDown={(e) => {
              e.stopPropagation();
              onResizeHandlePointerDown(Side.Top + Side.Left, bounds);
            }}
          />
          <rect className="fill-white stroke-1 stroke-blue-500" x={0} y={0} style={{
            cursor: "ns-resize",
            width: `${HANDLE_WIDTH}px`,
            height: `${HANDLE_WIDTH}px`,
            transform: `translate(${bounds.x + bounds.width / 2 - HANDLE_WIDTH / 2}px, ${bounds.y - HANDLE_WIDTH / 2}px)`,
          }}
            onPointerDown={(e) => {
              e.stopPropagation();
              onResizeHandlePointerDown(Side.Top, bounds);
            }}
          />
          <rect className="fill-white stroke-1 stroke-blue-500" x={0} y={0} style={{
            cursor: "nesw-resize",
            width: `${HANDLE_WIDTH}px`,
            height: `${HANDLE_WIDTH}px`,
            transform: `translate(${bounds.x - HANDLE_WIDTH / 2 + bounds.width}px, ${bounds.y - HANDLE_WIDTH / 2}px)`,
          }}
            onPointerDown={(e) => {
              e.stopPropagation();
              onResizeHandlePointerDown(Side.Top + Side.Right, bounds);
            }}
          />
          <rect className="fill-white stroke-1 stroke-blue-500" x={0} y={0} style={{
            cursor: "ew-resize",
            width: `${HANDLE_WIDTH}px`,
            height: `${HANDLE_WIDTH}px`,
            transform: `translate(${bounds.x - HANDLE_WIDTH / 2 + bounds.width}px, ${bounds.y + bounds.height / 2 - HANDLE_WIDTH / 2}px)`,
          }}
            onPointerDown={(e) => {
              e.stopPropagation();
              onResizeHandlePointerDown(Side.Right, bounds);
            }}
          />
          <rect className="fill-white stroke-1 stroke-blue-500" x={0} y={0} style={{
            cursor: "nwse-resize",
            width: `${HANDLE_WIDTH}px`,
            height: `${HANDLE_WIDTH}px`,
            transform: `translate(${bounds.x - HANDLE_WIDTH / 2 + bounds.width}px, ${bounds.y - HANDLE_WIDTH / 2 + bounds.height}px)`,
          }}
            onPointerDown={(e) => {
              e.stopPropagation();
              onResizeHandlePointerDown(Side.Right + Side.Bottom, bounds);
            }}
          />
          <rect className="fill-white stroke-1 stroke-blue-500" x={0} y={0} style={{
            cursor: "ns-resize",
            width: `${HANDLE_WIDTH}px`,
            height: `${HANDLE_WIDTH}px`,
            transform: `translate(${bounds.x + bounds.width / 2 - HANDLE_WIDTH / 2}px, ${bounds.y - HANDLE_WIDTH / 2 + bounds.height}px)`,
          }}
            onPointerDown={(e) => {
              e.stopPropagation();
              onResizeHandlePointerDown(Side.Bottom, bounds);
            }}
          />
          <rect className="fill-white stroke-1 stroke-blue-500" x={0} y={0} style={{
            cursor: "nesw-resize",
            width: `${HANDLE_WIDTH}px`,
            height: `${HANDLE_WIDTH}px`,
            transform: `translate(${bounds.x - HANDLE_WIDTH / 2}px, ${bounds.y - HANDLE_WIDTH / 2 + bounds.height}px)`,
          }}
            onPointerDown={(e) => {
              e.stopPropagation();
              onResizeHandlePointerDown(Side.Left + Side.Bottom, bounds);
            }}
          />
          <rect className="fill-white stroke-1 stroke-blue-500" x={0} y={0} style={{
            cursor: "ew-resize",
            width: `${HANDLE_WIDTH}px`,
            height: `${HANDLE_WIDTH}px`,
            transform: `translate(${bounds.x - HANDLE_WIDTH / 2}px, ${bounds.y - HANDLE_WIDTH / 2 + bounds.height / 2}px)`,
          }}
            onPointerDown={(e) => {
              e.stopPropagation();
              onResizeHandlePointerDown(Side.Left, bounds);
            }}
          />
        </>
      )}
    </>
  );
});

SelectionBox.displayName = "SelectionBox";
