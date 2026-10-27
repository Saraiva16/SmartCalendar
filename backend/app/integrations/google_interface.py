from abc import ABC, abstractmethod
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

class CalendarEventDTO(BaseModel):
    event_id: str
    title: str
    start_time: str # "HH:MM" ou ISO
    end_time: str
    date_key: str   # "YYYY-MM-DD"
    color: Optional[str] = "#3B82F6"
    is_all_day: bool = False

class GoogleTaskDTO(BaseModel):
    task_id: str
    title: str
    completed: bool
    date_key: Optional[str] = None

class IGoogleIntegrationService(ABC):
    @abstractmethod
    async def get_events_for_range(self, start_date: str, end_date: str) -> List[CalendarEventDTO]:
        """Busca eventos do Google Calendar no intervalo de datas especificado."""
        pass

    @abstractmethod
    async def get_tasks(self) -> List[GoogleTaskDTO]:
        """Busca tarefas pendentes ou recentes do Google Tasks."""
        pass

    @abstractmethod
    async def update_task_status(self, task_id: str, completed: bool) -> bool:
        """Atualiza o status de conclusão de uma tarefa no Google Tasks."""
        pass
