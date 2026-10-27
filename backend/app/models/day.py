from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional
from uuid import UUID, uuid4
from beanie import Document, Indexed
from pydantic import BaseModel, Field

class ContainerType(str, Enum):
    DAY_NOTES = "day_notes"
    TODO_ITEM = "todo_item"
    WEEK_CELL = "week_cell"
    MONTH_CELL = "month_cell"

class StrokePoint(BaseModel):
    # Coordenadas lógicas normalizadas [x, y, pressure]
    x: float
    y: float
    pressure: float = 0.5

class Stroke(BaseModel):
    stroke_id: UUID = Field(default_factory=uuid4)
    container_type: ContainerType
    todo_id: Optional[UUID] = None
    color: str = "#000000"
    size: float = 4.0
    # Pontos representados como tuplas/listas [x, y, pressure] ou objetos estritos
    points: List[List[float]] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TodoItem(BaseModel):
    todo_id: UUID = Field(default_factory=uuid4)
    completed: bool = False
    title: Optional[str] = None  # Suporta texto de tarefas vindas do celular / Google Tasks
    order: int = 0
    google_task_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None

class Day(Document):
    user_id: Indexed(str)
    date_key: Indexed(str)  # "YYYY-MM-DD"
    strokes: List[Stroke] = Field(default_factory=list)
    todos: List[TodoItem] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "days"
        indexes = [
            [("user_id", 1), ("date_key", 1)],  # Chave composta
        ]

