import { TooltipTrigger } from "@radix-ui/react-tooltip";
import { Tooltip, TooltipContent, TooltipProvider } from "./ui/tooltip";

export interface HintProps {
  label: string;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  alignOffset?: number;
}

export default function Hint({
  label, children, side, align, alignOffset, sideOffset
}: HintProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent
         className="text-white bg-black border-black" 
         side={side} align={align} sideOffset={sideOffset} alignOffset={alignOffset}>
          <p className="font-semibold capitalize">
          {label}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>


  )
}
