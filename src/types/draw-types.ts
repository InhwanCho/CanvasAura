export enum LayerType {
  Rectangle,
  Ellipse,
  Path,
  Text,
  Note,
}

export enum Side {
  Top = 1,
  Bottom = 2,
  Left = 4,
  Right = 8,
}

export type XYWH = {
  x: number;
  y: number;
  height: number;
  width: number;
};

export type Draw = {
  ctx: CanvasRenderingContext2D;
  currentPoint: Point;
  prevPoint: Point | null;
};

export type Point = { x: number; y: number };
