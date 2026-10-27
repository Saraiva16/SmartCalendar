import { db } from './dexie';
import type { DayData } from '../types/whiteboard';

const API_BASE_URL = 'http://localhost:8000/api/v1';

class SyncService {
  private syncTimers: Map<string, number> = new Map();
  private isPulling = false;

  /**
   * Agenda a sincronização via debounce (1500ms após última alteração no dateKey)
   */
  public scheduleSync(dateKey: string) {
    const existingTimer = this.syncTimers.get(dateKey);
    if (existingTimer) {
      window.clearTimeout(existingTimer);
    }

    const timer = window.setTimeout(() => {
      this.syncDateKey(dateKey);
      this.syncTimers.delete(dateKey);
    }, 1500);

    this.syncTimers.set(dateKey, timer);
  }

  /**
   * Realiza o envio de dados locais não sincronizados para o backend
   */
  public async syncDateKey(dateKey: string): Promise<void> {
    try {
      // 1. Sincronizar Traços não enviados
      const pendingStrokes = await db.strokes
        .where('date_key')
        .equals(dateKey)
        .filter((s) => s.is_synced === false)
        .toArray();

      if (pendingStrokes.length > 0) {
        const payload = {
          strokes: pendingStrokes.map((s) => ({
            stroke_id: s.stroke_id,
            container_type: s.container_type,
            todo_id: s.todo_id || null,
            color: s.color,
            size: s.size,
            points: s.points,
          })),
        };

        const res = await fetch(`${API_BASE_URL}/days/${dateKey}/strokes/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          // Marca traços como sincronizados localmente
          await Promise.all(
            pendingStrokes.map((s) => db.strokes.update(s.stroke_id, { is_synced: true }))
          );
        }
      }

      // 2. Sincronizar Tarefas não enviadas
      const pendingTodos = await db.todos
        .where('date_key')
        .equals(dateKey)
        .filter((t) => t.is_synced === false)
        .toArray();

      if (pendingTodos.length > 0) {
        for (const todo of pendingTodos) {
          const res = await fetch(`${API_BASE_URL}/days/${dateKey}/todos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              todo_id: todo.todo_id,
              completed: todo.completed,
              title: todo.title || null,
              order: todo.order,
              google_task_id: todo.google_task_id || null,
            }),
          });

          if (res.ok) {
            await db.todos.update(todo.todo_id, { is_synced: true });
          }
        }
      }
    } catch (error) {
      console.warn(`[SyncService] Falha temporária ao sincronizar ${dateKey} (offline):`, error);
    }
  }

  /**
   * Baixa os dados do dia da API e atualiza o IndexedDB
   */
  public async pullDayData(dateKey: string): Promise<void> {
    if (this.isPulling) return;
    this.isPulling = true;

    try {
      const res = await fetch(`${API_BASE_URL}/days/${dateKey}`);
      if (!res.ok) return;

      const data: DayData = await res.json();

      // Salva traços no Dexie
      for (const stroke of data.strokes) {
        const local = await db.strokes.get(stroke.stroke_id);
        if (!local) {
          await db.strokes.put({
            ...stroke,
            date_key: dateKey,
            is_synced: true,
          });
        }
      }

      // Salva tarefas no Dexie
      for (const todo of data.todos) {
        const local = await db.todos.get(todo.todo_id);
        if (!local) {
          await db.todos.put({
            ...todo,
            date_key: dateKey,
            is_synced: true,
          });
        }
      }
    } catch (error) {
      console.warn(`[SyncService] Não foi possível carregar dados do servidor para ${dateKey}:`, error);
    } finally {
      this.isPulling = false;
    }
  }
}

export const syncService = new SyncService();
