import { Circle, MousePointer2, Pencil, Redo2, Square, StickyNote, Type, Undo2 } from "lucide-react"
import ToolButton from "./tool-button";

interface ToolbarProps {
  canvasState: 'select' | 'draw';
  setCanvasState: (newState: 'select' | 'draw') => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export default function Toolbar({ canvasState, setCanvasState, undo, redo, canRedo, canUndo }: ToolbarProps) {
  return (
    <div className='absolute top-[50%] -translate-y-[50%] left-2 flex flex-col gap-y-4'>
      <div className='bg-white rounded-md p-1.5 flex gap-y-1 flex-col items-center shadow-md'>
        <ToolButton label="Select" icon={MousePointer2}
          onClick={() => setCanvasState('select')} isActive={canvasState === 'select'} />
        <ToolButton label="Pen" icon={Pencil}
          onClick={() => setCanvasState('draw')} isActive={canvasState === 'draw'} />
        <ToolButton label="Type" icon={Type}
          onClick={() => { }} isActive={false} />
        <ToolButton label="Sticky note" icon={StickyNote}
          onClick={() => { }} isActive={false} />
        <ToolButton label="Rectangle" icon={Square}
          onClick={() => { }} isActive={false} />
        <ToolButton label="Ellipse" icon={Circle}
          onClick={() => { }} isActive={false} />
      </div>
      <div className='bg-white rounded-md p-1.5 flex flex-col items-center shadow-md'>
        <ToolButton label="Undo" icon={Undo2} onClick={undo} isDisabled={!canUndo} />
        <ToolButton label="Redo" icon={Redo2} onClick={redo} isDisabled={!canRedo} />
      </div>
    </div>
  )
}

export function ToolbarSkeleton() {
  return (
    <div className='absolute top-[50%] -translate-y-[50%] left-2 flex flex-col gap-y-4 bg-white h-[360px] w-[52px] shadow-md rounded-md'>
    </div>
  )
}