import { DrawHistory } from '@/app/board/[boardId]/page';
import {create} from 'zustand';

type DrawState = {
  userDrawHistories: Record<string, DrawHistory[]>;
  redoHistories: Record<string, DrawHistory[]>;
  drawHistory: DrawHistory[];
  setUserDrawHistories: (histories: Record<string, DrawHistory[]>) => void;
  setRedoHistories: (histories: Record<string, DrawHistory[]>) => void;
  setDrawHistory: (history: DrawHistory[]) => void;
};

export const useDrawStore = create<DrawState>((set) => ({
  userDrawHistories: {},
  redoHistories: {},
  drawHistory: [],
  setUserDrawHistories: (histories) => set({ userDrawHistories: histories }),
  setRedoHistories: (histories) => set({ redoHistories: histories }),
  setDrawHistory: (history) => set({ drawHistory: history }),
}));
