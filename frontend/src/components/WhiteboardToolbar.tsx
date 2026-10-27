import React from 'react';
import { useUIStore } from '../stores/useUIStore';
import { Pen, Eraser, Calendar, CheckSquare, Grid } from 'lucide-react';

const COLORS = [
  '#0F172A', // Slate 900
  '#2563EB', // Blue 600
  '#DC2626', // Red 600
  '#16A34A', // Green 600
  '#9333EA', // Purple 600
];

const SIZES = [2.5, 4.0, 7.0];

export const WhiteboardToolbar: React.FC = () => {
  const {
    toolMode,
    penColor,
    penSize,
    viewMode,
    setToolMode,
    setPenColor,
    setPenSize,
    setViewMode,
  } = useUIStore();

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between select-none shadow-xs z-30">
      {/* 1. Modos de Visão */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
        <button
          onClick={() => setViewMode('WEEKLY')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
            viewMode === 'WEEKLY'
              ? 'bg-white text-blue-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Semanal
        </button>

        <button
          onClick={() => setViewMode('DAILY')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
            viewMode === 'DAILY'
              ? 'bg-white text-blue-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          Diária
        </button>

        <button
          onClick={() => setViewMode('MONTHLY')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
            viewMode === 'MONTHLY'
              ? 'bg-white text-blue-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Grid className="w-4 h-4" />
          Mensal
        </button>
      </div>

      {/* 2. Ferramentas de Escrita / Canetão */}
      <div className="flex items-center gap-3">
        {/* Seletor Caneta vs Borracha */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setToolMode('pen')}
            className={`p-1.5 rounded-md transition-all ${
              toolMode === 'pen'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Caneta livre"
          >
            <Pen className="w-4 h-4" />
          </button>
          <button
            onClick={() => setToolMode('eraser')}
            className={`p-1.5 rounded-md transition-all ${
              toolMode === 'eraser'
                ? 'bg-white text-red-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Apagador"
          >
            <Eraser className="w-4 h-4" />
          </button>
        </div>

        {/* Cores */}
        {toolMode === 'pen' && (
          <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setPenColor(c)}
                className={`w-6 h-6 rounded-full transition-transform ${
                  penColor === c ? 'scale-125 ring-2 ring-blue-500 ring-offset-1' : 'opacity-80 hover:opacity-100'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        )}

        {/* Espessuras */}
        {toolMode === 'pen' && (
          <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
            {SIZES.map((s) => (
              <button
                key={s}
                onClick={() => setPenSize(s)}
                className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${
                  penSize === s ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <div
                  className="rounded-full bg-current"
                  style={{ width: `${s * 2}px`, height: `${s * 2}px` }}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
};
