import React, { useEffect, useState } from 'react';
import { WhiteboardCanvas } from '../components/WhiteboardCanvas';
import { useUIStore } from '../stores/useUIStore';

interface DayColumn {
  name: string;
  shortName: string;
  dateKey: string;
  displayDate: string;
  isToday: boolean;
}

export const WeeklyView: React.FC = () => {
  const { setSelectedDateForDaily, setViewMode } = useUIStore();
  const [days, setDays] = useState<DayColumn[]>([]);

  // Calcula os dias da semana corrente iniciando na SEGUNDA-FEIRA
  useEffect(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0: Dom, 1: Seg, ...
    // Se hoje for domingo (0), a segunda foi 6 dias atrás; se for outro dia, (dayOfWeek - 1) dias atrás
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);

    const names = [
      { name: 'Segunda-feira', shortName: 'SEG' },
      { name: 'Terça-feira', shortName: 'TER' },
      { name: 'Quarta-feira', shortName: 'QUA' },
      { name: 'Quinta-feira', shortName: 'QUI' },
      { name: 'Sexta-feira', shortName: 'SEX' },
      { name: 'Sábado', shortName: 'SAB' },
      { name: 'Domingo', shortName: 'DOM' },
    ];

    const weekDays: DayColumn[] = names.map((item, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);

      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayNum = String(d.getDate()).padStart(2, '0');
      const dateKey = `${y}-${m}-${dayNum}`;

      const isToday =
        today.getFullYear() === d.getFullYear() &&
        today.getMonth() === d.getMonth() &&
        today.getDate() === d.getDate();

      return {
        ...item,
        dateKey,
        displayDate: `${dayNum}/${m}`,
        isToday,
      };
    });

    setDays(weekDays);
  }, []);

  const handleDayClick = (dateKey: string) => {
    setSelectedDateForDaily(dateKey);
    setViewMode('DAILY');
  };

  if (days.length === 0) return null;

  const weekdays = days.slice(0, 5); // SEG a SEX
  const saturday = days[5];
  const sunday = days[6];

  return (
    <div className="flex-1 w-full h-[calc(100vh-3.5rem)] grid grid-cols-6 bg-slate-200 gap-px">
      {/* Colunas 1 a 5: Segunda a Sexta ocupando 100% da altura */}
      {weekdays.map((day) => (
        <div key={day.dateKey} className="flex flex-col bg-white overflow-hidden relative">
          {/* Header do Dia */}
          <div
            onClick={() => handleDayClick(day.dateKey)}
            className={`px-3 py-2 border-b border-slate-100 flex items-center justify-between cursor-pointer select-none transition-colors ${
              day.isToday ? 'bg-blue-50/70' : 'hover:bg-slate-50'
            }`}
          >
            <span className={`text-xs font-bold uppercase tracking-wider ${day.isToday ? 'text-blue-600' : 'text-slate-700'}`}>
              {day.shortName}
            </span>
            <span className={`text-xs font-medium ${day.isToday ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
              {day.displayDate}
            </span>
          </div>

          {/* Superfície do Canvas Independente do Dia */}
          <div className="flex-1 relative">
            <WhiteboardCanvas dateKey={day.dateKey} containerType="week_cell" />
          </div>
        </div>
      ))}

      {/* Coluna 6: Dividida horizontalmente ao meio (Sábado no topo, Domingo na base) */}
      <div className="flex flex-col bg-slate-200 gap-px h-full">
        {/* Sábado (50% superior) */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
          <div
            onClick={() => handleDayClick(saturday.dateKey)}
            className={`px-3 py-1.5 border-b border-slate-100 flex items-center justify-between cursor-pointer select-none transition-colors ${
              saturday.isToday ? 'bg-blue-50/70' : 'hover:bg-slate-50'
            }`}
          >
            <span className={`text-xs font-bold uppercase tracking-wider ${saturday.isToday ? 'text-blue-600' : 'text-slate-700'}`}>
              {saturday.shortName}
            </span>
            <span className={`text-xs font-medium ${saturday.isToday ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
              {saturday.displayDate}
            </span>
          </div>
          <div className="flex-1 relative">
            <WhiteboardCanvas dateKey={saturday.dateKey} containerType="week_cell" />
          </div>
        </div>

        {/* Domingo (50% inferior) */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
          <div
            onClick={() => handleDayClick(sunday.dateKey)}
            className={`px-3 py-1.5 border-b border-slate-100 flex items-center justify-between cursor-pointer select-none transition-colors ${
              sunday.isToday ? 'bg-blue-50/70' : 'hover:bg-slate-50'
            }`}
          >
            <span className={`text-xs font-bold uppercase tracking-wider ${sunday.isToday ? 'text-blue-600' : 'text-slate-700'}`}>
              {sunday.shortName}
            </span>
            <span className={`text-xs font-medium ${sunday.isToday ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
              {sunday.displayDate}
            </span>
          </div>
          <div className="flex-1 relative">
            <WhiteboardCanvas dateKey={sunday.dateKey} containerType="week_cell" />
          </div>
        </div>
      </div>
    </div>
  );
};

