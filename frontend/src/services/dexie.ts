import Dexie, { type Table } from 'dexie';
import type { Stroke, TodoItem } from '../types/whiteboard';

export interface SyncQueueItem {
  id?: number;
  type: 'UPSERT_STROKE' | 'DELETE_STROKE' | 'UPSERT_TODO' | 'DELETE_TODO';
  date_key: string;
  payload: any;
  created_at: string;
}

export class SmartCalendarDB extends Dexie {
  strokes!: Table<Stroke, string>;
  todos!: Table<TodoItem, string>;
  syncQueue!: Table<SyncQueueItem, number>;

  constructor() {
    super('SmartCalendarDB');
    this.version(1).stores({
      strokes: 'stroke_id, date_key, container_type, todo_id, is_synced',
      todos: 'todo_id, date_key, completed, order, is_synced',
      syncQueue: '++id, date_key, type, created_at',
    });
  }
}

export const db = new SmartCalendarDB();

