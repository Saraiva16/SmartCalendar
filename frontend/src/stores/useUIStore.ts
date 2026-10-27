import { create } from 'zustand';
import type { ToolMode, ViewMode } from '../types/whiteboard';

interface UIState {
  currentDateKey: string;
  viewMode: ViewMode;
  toolMode: ToolMode;
  penColor: string;
  penSize: number;
  selectedDateForDaily: string;
  
  setCurrentDateKey: (dateKey: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setToolMode: (tool: ToolMode) => void;
  setPenColor: (color: string) => void;
  setPenSize: (size: number) => void;
  setSelectedDateForDaily: (dateKey: string) => void;
}

// Data atual local formato YYYY-MM-DD
const getTodayKey = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const useUIStore = create<UIState>((set) => ({
  currentDateKey: getTodayKey(),
  viewMode: 'WEEKLY',
  toolMode: 'pen',
  penColor: '#1E293B', // Slate 800 - Caneta escura
  penSize: 4.0,
  selectedDateForDaily: getTodayKey(),

  setCurrentDateKey: (currentDateKey) => set({ currentDateKey }),
  setViewMode: (viewMode) => set({ viewMode }),
  setToolMode: (toolMode) => set({ toolMode }),
  setPenColor: (penColor) => set({ penColor }),
  setPenSize: (penSize) => set({ penSize }),
  setSelectedDateForDaily: (selectedDateForDaily) => set({ selectedDateForDaily }),
}));

