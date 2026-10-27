import React from 'react';
import { useUIStore } from './stores/useUIStore';
import { WhiteboardToolbar } from './components/WhiteboardToolbar';
import { WeeklyView } from './views/WeeklyView';
import { DailyView } from './views/DailyView';
import { MonthlyView } from './views/MonthlyView';

export const App: React.FC = () => {
  const { viewMode } = useUIStore();

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-100 overflow-hidden select-none">
      {/* Barra de Ferramentas / Header */}
      <WhiteboardToolbar />

      {/* Renderização Condicional da Visão Ativa */}
      <main className="flex-1 overflow-hidden relative">
        {viewMode === 'WEEKLY' && <WeeklyView />}
        {viewMode === 'DAILY' && <DailyView />}
        {viewMode === 'MONTHLY' && <MonthlyView />}
      </main>
    </div>
  );
};

export default App;
