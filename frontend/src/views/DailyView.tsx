import React, { useEffect, useState } from 'react';
import { WhiteboardCanvas } from '../components/WhiteboardCanvas';
import { useUIStore } from '../stores/useUIStore';
import { db } from '../services/dexie';
import { syncService } from '../services/syncService';
import type { TodoItem } from '../types/whiteboard';
import { Plus, Check, Trash2 } from 'lucide-react';

export const DailyView: React.FC = () => {
  const { selectedDateForDaily } = useUIStore();
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodoTitle, setNewTodoTitle] = useState('');

  // 1. Carregar tarefas do Dexie
  const loadTodos = async () => {
    await syncService.pullDayData(selectedDateForDaily);
    const list = await db.todos
      .where('date_key')
      .equals(selectedDateForDaily)
      .sortBy('order');
    setTodos(list);
  };

  useEffect(() => {
    loadTodos();
  }, [selectedDateForDaily]);

  // Formatação amigável de cabeçalhos
  const dateObj = new Date(selectedDateForDaily + 'T00:00:00');
  const dayName = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });
  const formattedDate = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

  // 2. Alternar conclusão do Checkbox
  const toggleTodo = async (todo: TodoItem) => {
    const updated = !todo.completed;
    await db.todos.update(todo.todo_id, {
      completed: updated,
      completed_at: updated ? new Date().toISOString() : null,
      is_synced: false,
    });
    syncService.scheduleSync(selectedDateForDaily);
    loadTodos();
  };

  // 3. Adicionar nova tarefa
  const handleAddTodo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const newTodo: TodoItem = {
      todo_id: crypto.randomUUID(),
      date_key: selectedDateForDaily,
      completed: false,
      title: newTodoTitle.trim() || null, // Se vazio, vira espaço livre para manuscrito
      order: todos.length,
      created_at: new Date().toISOString(),
      is_synced: false,
    };
    await db.todos.put(newTodo);
    setNewTodoTitle('');
    syncService.scheduleSync(selectedDateForDaily);
    loadTodos();
  };

  // 4. Excluir tarefa e seus traços
  const handleDeleteTodo = async (todoId: string) => {
    await db.todos.delete(todoId);
    // Limpa os traços que estavam vinculados a esse todo
    const strokes = await db.strokes.where('todo_id').equals(todoId).toArray();
    await Promise.all(strokes.map((s) => db.strokes.delete(s.stroke_id)));

    fetch(`http://localhost:8000/api/v1/days/${selectedDateForDaily}/todos/${todoId}`, {
      method: 'DELETE',
    }).catch(() => {});

    loadTodos();
  };

  return (
    <div className="flex-1 w-full h-[calc(100vh-3.5rem)] grid grid-cols-[55%_45%] bg-slate-200 gap-px">
      {/* PAINEL ESQUERDO (55%): Anotações do Dia (day_notes) */}
      <div className="flex flex-col bg-white overflow-hidden relative">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between select-none bg-slate-50/60">
          <div>
            <h2 className="text-xl font-black text-slate-800 capitalize">{dayName}</h2>
            <p className="text-xs text-slate-400 font-medium">{formattedDate}</p>
          </div>
          <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded">
            Lousa do Dia
          </span>
        </div>

        {/* Superfície livre para anotações do dia */}
        <div className="flex-1 relative">
          <WhiteboardCanvas dateKey={selectedDateForDaily} containerType="day_notes" />
        </div>
      </div>

      {/* PAINEL DIREITO (45%): Lista de Checkboxes & Tarefas */}
      <div className="flex flex-col bg-white overflow-hidden border-l border-slate-100">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between select-none bg-slate-50/60">
          <div>
            <h2 className="text-base font-bold text-slate-800">Tarefas & Metas</h2>
            <p className="text-xs text-slate-400">Escreva na linha ou digite</p>
          </div>

          <form onSubmit={handleAddTodo} className="flex items-center gap-1.5">
            <input
              type="text"
              placeholder="+ Nova linha..."
              value={newTodoTitle}
              onChange={(e) => setNewTodoTitle(e.target.value)}
              className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 w-36"
            />
            <button
              type="submit"
              className="p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-xs"
              title="Adicionar tarefa"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Lista de Itens de Tarefa com Canvas Manuscrito por Linha */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {todos.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 select-none p-6 text-center">
              <p className="text-xs">Nenhuma tarefa criada para este dia.</p>
              <button
                onClick={() => handleAddTodo()}
                className="mt-3 text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Criar linha para anotação
              </button>
            </div>
          ) : (
            todos.map((todo) => (
              <div
                key={todo.todo_id}
                className={`flex items-center h-14 px-4 gap-3 group transition-colors ${
                  todo.completed ? 'bg-slate-50/80 opacity-60' : 'hover:bg-slate-50/50'
                }`}
              >
                {/* Checkbox interativo */}
                <button
                  onClick={() => toggleTodo(todo)}
                  className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                    todo.completed
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-slate-300 hover:border-blue-500 bg-white'
                  }`}
                >
                  {todo.completed && <Check className="w-4 h-4 stroke-[3]" />}
                </button>

                {/* Conteúdo: Texto Digitado ou Canvas Manuscrito */}
                <div className="flex-1 h-full relative flex items-center overflow-hidden">
                  {todo.title ? (
                    <span
                      className={`text-sm select-none ${
                        todo.completed ? 'line-through text-slate-400' : 'text-slate-700 font-medium'
                      }`}
                    >
                      {todo.title}
                    </span>
                  ) : (
                    <WhiteboardCanvas
                      dateKey={selectedDateForDaily}
                      containerType="todo_item"
                      todoId={todo.todo_id}
                      className="w-full h-full"
                    />
                  )}
                </div>

                {/* Botão de Excluir */}
                <button
                  onClick={() => handleDeleteTodo(todo.todo_id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-opacity"
                  title="Excluir tarefa"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

