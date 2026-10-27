from datetime import datetime
from enum import Enum
from typing import List, Optional
from uuid import UUID, uuid4
from pydantic import BaseModel, Field

class ContainerTypeEnum(str, Enum):
    DAY_NOTES = "day_notes"
    TODO_ITEM = "todo_item"
    WEEK_CELL = "week_cell"
    MONTH_CELL = "month_cell"

# --- Strokes DTOs ---

class StrokeCreateDTO(BaseModel):
    stroke_id: UUID = Field(default_factory=uuid4, description="UUID do traço (idempotente se gerado no cliente)")
    container_type: ContainerTypeEnum = Field(..., description="Tipo de container visual ao qual o traço pertence")
    todo_id: Optional[UUID] = Field(None, description="Vinculação se for traço associado a um checkbox")
    color: str = Field("#000000", description="Cor hexadecimal do traço")
    size: float = Field(4.0, ge=0.5, le=50.0, description="Espessura lógica do traço")
    points: List[List[float]] = Field(
        ...,
        description="Array de pontos [x, y, pressure] normalizados no espaço lógico de coordenadas"
    )

class StrokeResponseDTO(BaseModel):
    stroke_id: UUID
    container_type: ContainerTypeEnum
    todo_id: Optional[UUID] = None
    color: str
    size: float
    points: List[List[float]]
    created_at: datetime

# --- Todos DTOs ---

class TodoCreateDTO(BaseModel):
    todo_id: UUID = Field(default_factory=uuid4, description="UUID do item")
    completed: bool = False
    title: Optional[str] = Field(None, description="Título textual se originado via Google Tasks ou celular")
    order: int = Field(0, description="Ordem de exibição na lista")
    google_task_id: Optional[str] = None

class TodoUpdateDTO(BaseModel):
    completed: Optional[bool] = None
    title: Optional[str] = None
    order: Optional[int] = None
    google_task_id: Optional[str] = None

class TodoResponseDTO(BaseModel):
    todo_id: UUID
    completed: bool
    title: Optional[str] = None
    order: int
    google_task_id: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

# --- Day DTOs ---

class DayResponseDTO(BaseModel):
    user_id: str
    date_key: str
    strokes: List[StrokeResponseDTO]
    todos: List[TodoResponseDTO]
    created_at: datetime
    updated_at: datetime

class BatchStrokesDTO(BaseModel):
    strokes: List[StrokeCreateDTO] = Field(..., description="Lista de traços criados/atualizados offline para sincronização")
