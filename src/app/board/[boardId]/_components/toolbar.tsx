import { Circle, MousePointer2, Pencil, Redo2, Square, StickyNote, Type, Undo2 } from "lucide-react";
import ToolButton from "./tool-button";
import { CanvasMode } from "../page";

interface ToolbarProps {
  canvasState: CanvasMode; // CanvasMode로 상태를 전달받음
  setCanvasState: (newState: CanvasMode) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export default function Toolbar({ canvasState, setCanvasState, undo, redo, canRedo, canUndo }: ToolbarProps) {
  return (
    <div className='absolute top-[50%] -translate-y-[50%] left-2 flex flex-col gap-y-4'>
      <div className='bg-white rounded-md p-1.5 flex gap-y-1 flex-col items-center shadow-md'>
        <ToolButton
          label="Select"
          icon={MousePointer2}
          onClick={() => setCanvasState(CanvasMode.None)} // 선택 모드로 전환
          isActive={canvasState === CanvasMode.None}
        />
        <ToolButton
          label="Pen"
          icon={Pencil}
          onClick={() => setCanvasState(CanvasMode.Pencil)} // 드로잉 모드로 전환
          isActive={canvasState === CanvasMode.Pencil}
        />
        <ToolButton
          label="Type"
          icon={Type}
          onClick={() => { }} 
          isActive={false} // 임시 비활성화
        />
        <ToolButton
          label="Sticky note"
          icon={StickyNote}
          onClick={() => { }} 
          isActive={false} // 임시 비활성화
        />
        <ToolButton
          label="Rectangle"
          icon={Square}
          onClick={() => { }} 
          isActive={false} // 임시 비활성화
        />
        <ToolButton
          label="Ellipse"
          icon={Circle}
          onClick={() => { }} 
          isActive={false} // 임시 비활성화
        />
      </div>
      <div className='bg-white rounded-md p-1.5 flex flex-col items-center shadow-md'>
        <ToolButton label="Undo" icon={Undo2} onClick={undo} isDisabled={!canUndo} />
        <ToolButton label="Redo" icon={Redo2} onClick={redo} isDisabled={!canRedo} />
      </div>
    </div>
  );
}
