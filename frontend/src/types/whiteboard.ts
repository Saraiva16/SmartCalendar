export type ContainerType = 'day_notes' | 'todo_item' | 'week_cell' | 'month_cell';

// Ponto bruto no canvas ou normalizado: [x, y, pressure]
export type Point = [number, number, number];

export interface Stroke {
  stroke_id: string; // UUIDv4
  date_key: string;  // "YYYY-MM-DD"
  container_type: ContainerType;
  todo_id?: string | null;
  color: string;
  size: number;
  points: Point[];
  created_at: string;
  is_synced?: boolean; // Flag para controle de sync offline
}

export interface TodoItem {
  todo_id: string; // UUIDv4
  date_key: string; // "YYYY-MM-DD"
  completed: boolean;
  title?: string | null;
  order: number;
  google_task_id?: string | null;
  created_at: string;
  completed_at?: string | null;
  is_synced?: boolean;
}

export interface DayData {
  user_id: string;
  date_key: string;
  strokes: Stroke[];
  todos: TodoItem[];
  created_at: string;
  updated_at: string;
}

export type ViewMode = 'WEEKLY' | 'DAILY' | 'MONTHLY';
export type ToolMode = 'pen' | 'eraser';

