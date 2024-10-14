'use client'
import { LayerType, Point, Side, XYWH } from "@/types/draw-types";
import { useState, useEffect } from "react";
import { memo } from "react";

const HANDLE_WIDTH = 8;

interface SelectionBoxProps {
  selectedLayerId: string | null; // 선택된 Layer의 ID를 prop으로 받음
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  layers: Map<string, any>; // 모든 layer 정보가 담긴 map (ID를 키로 사용)
  onResizeHandlePointerDown: (corner: Side, initialBounds: XYWH) => void;
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

  useEffect(() => {
    if (selectedLayer) {
      if (selectedLayer.type === LayerType.Path) {
        // PathLayer의 경우 이미 bounds 정보가 있으므로 이를 그대로 사용
        setBounds({
          x: selectedLayer.bounds.x,
          y: selectedLayer.bounds.y,
          width: selectedLayer.bounds.width,
          height: selectedLayer.bounds.height,
        });
      } else {
        // 다른 Layer (Rectangle, Ellipse 등)의 경우에도 기존 bounds 사용
        setBounds({
          x: selectedLayer.bounds.x,
          y: selectedLayer.bounds.y,
          width: selectedLayer.bounds.width,
          height: selectedLayer.bounds.height,
        });
      }
      setIsShowingHandles(selectedLayer.type !== LayerType.Path);
    } else {
      setBounds(null);
      setIsShowingHandles(false);
    }
  }, [selectedLayer]);
  
  

  if (!bounds) {
    return null;  // bounds가 없으면 아무것도 렌더링하지 않음
  }

  return (
    <>
      <rect className="fill-transparent stroke-blue-500 stroke-1 pointer-events-none"
        x={bounds.x}
        y={bounds.y}
        width={bounds.width}
        height={bounds.height}
      />
      {isShowingHandles && (
        <>
          <rect className="fill-white stroke-1 stroke-blue-500"
            style={{
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
          <rect className="fill-white stroke-1 stroke-blue-500"
            style={{
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
          <rect className="fill-white stroke-1 stroke-blue-500"
            style={{
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
          <rect className="fill-white stroke-1 stroke-blue-500"
            style={{
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
          <rect className="fill-white stroke-1 stroke-blue-500"
            style={{
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
          <rect className="fill-white stroke-1 stroke-blue-500"
            style={{
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
          <rect className="fill-white stroke-1 stroke-blue-500"
            style={{
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
          <rect className="fill-white stroke-1 stroke-blue-500"
            style={{
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
