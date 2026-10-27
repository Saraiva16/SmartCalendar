import React, { useEffect, useState } from 'react';
import { useUIStore } from '../stores/useUIStore';
import { db } from '../services/dexie';
import type { Stroke } from '../types/whiteboard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthCellData {
  dateKey: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasStrokes: boolean;
}

export const MonthlyView: React.FC = () => {
  const { setSelectedDateForDaily, setViewMode } = useUIStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [cells, setCells] = useState<MonthCellData[]>([]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // 1. Gera as semanas do mês começando na SEGUNDA-FEIRA (grade adaptável de 5 a 6 linhas)
  useEffect(() => {
    const generateMonthGrid = async () => {
      const today = new Date();
      const firstDayOfMonth = new Date(year, month, 1);
      const lastDayOfMonth = new Date(year, month + 1, 0);

      // Dia da semana do 1º dia (0=Dom, 1=Seg, ... 6=Sab)
      const firstWeekday = firstDayOfMonth.getDay();
      // Ajuste para semana iniciando na segunda (Seg=0, Ter=1, ..., Dom=6)
      const offsetToMonday = firstWeekday === 0 ? 6 : firstWeekday - 1;

      const startDate = new Date(firstDayOfMonth);
      startDate.setDate(firstDayOfMonth.getDate() - offsetToMonday);

      // Calcula quantas semanas são necessárias (geralmente 35 ou 42 células)
      const totalDaysToDisplay = (lastDayOfMonth.getDate() + offsetToMonday) > 35 ? 42 : 35;

      const gridCells: MonthCellData[] = [];
      const dateKeysToFetch: string[] = [];

      for (let i = 0; i < totalDaysToDisplay; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);

        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dayNum = String(d.getDate()).padStart(2, '0');
        const dateKey = `${y}-${m}-${dayNum}`;

        dateKeysToFetch.push(dateKey);

        const isCurrentMonth = d.getMonth() === month;
        const isToday =
          today.getFullYear() === d.getFullYear() &&
          today.getMonth() === d.getMonth() &&
          today.getDate() === d.getDate();

        gridCells.push({
          dateKey,
          dayNumber: d.getDate(),
          isCurrentMonth,
          isToday,
          hasStrokes: false,
        });
      }

      // Consulta no Dexie para saber quais dias têm traços
      const existingStrokes = await db.strokes
        .where('date_key')
        .anyOf(dateKeysToFetch)
        .toArray();

      const datesWithStrokesSet = new Set(existingStrokes.map((s: Stroke) => s.date_key));

      const updated = gridCells.map((cell) => ({
        ...cell,
        hasStrokes: datesWithStrokesSet.has(cell.dateKey),
      }));

      setCells(updated);
    };

    generateMonthGrid();
  }, [year, month]);

  // Duplo toque / clique rápido para navegar à Visão Diária
  const handleCellDoubleClick = (dateKey: string) => {
    setSelectedDateForDaily(dateKey);
    setViewMode('DAILY');
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthTitle = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const weekDayHeaders = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'];

  return (
    <div className="flex-1 w-full h-[calc(100vh-3.5rem)] flex flex-col bg-white">
      {/* Navegação de Mês */}
      <div className="h-12 border-b border-slate-200 px-6 flex items-center justify-between select-none bg-slate-50">
        <h2 className="text-base font-bold text-slate-800 capitalize">{monthTitle}</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevMonth}
            className="p-1 rounded-md hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1 rounded-md hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Cabeçalho dos Dias da Semana */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-100 select-none">
        {weekDayHeaders.map((day) => (
          <div key={day} className="py-1.5 text-center text-[11px] font-bold text-slate-600 tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Grade de Células */}
      <div
        className="flex-1 grid grid-cols-7 bg-slate-200 gap-px"
        style={{ gridTemplateRows: `repeat(${cells.length / 7}, minmax(0, 1fr))` }}
      >
        {cells.map((cell) => (
          <div
            key={cell.dateKey}
            onDoubleClick={() => handleCellDoubleClick(cell.dateKey)}
            className={`p-2 flex flex-col justify-between transition-colors select-none cursor-pointer ${
              cell.isCurrentMonth ? 'bg-white' : 'bg-slate-50/70 text-slate-400'
            } ${cell.isToday ? 'ring-2 ring-blue-500 ring-inset' : 'hover:bg-blue-50/30'}`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                  cell.isToday
                    ? 'bg-blue-600 text-white'
                    : cell.isCurrentMonth
                    ? 'text-slate-800'
                    : 'text-slate-400'
                }`}
              >
                {cell.dayNumber}
              </span>
              {cell.hasStrokes && (
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" title="Possui anotações" />
              )}
            </div>

            <div className="flex-1 flex items-center justify-center text-[10px] text-slate-400 font-medium">
              {cell.hasStrokes ? (
                <span className="text-blue-600 font-semibold">Ver lousa</span>
              ) : (
                <span className="opacity-0 hover:opacity-100 text-slate-300">Duplo clique</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

