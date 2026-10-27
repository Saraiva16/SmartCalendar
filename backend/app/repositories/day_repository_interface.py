from abc import ABC, abstractmethod
from typing import Optional, List
from uuid import UUID
from app.models.day import Day, Stroke, TodoItem

class IDayRepository(ABC):
    @abstractmethod
    async def get_or_create(self, user_id: str, date_key: str) -> Day:
        """Obtém o documento do dia ou cria um novo com valores padrão."""
        pass

    @abstractmethod
    async def get_by_date_range(self, user_id: str, start_date: str, end_date: str) -> List[Day]:
        """Busca múltiplos dias dentro de um intervalo de datas (para visão semanal/mensal)."""
        pass

    @abstractmethod
    async def save(self, day: Day) -> Day:
        """Persiste ou atualiza o documento do dia."""
        pass

    @abstractmethod
    async def upsert_stroke(self, user_id: str, date_key: str, stroke: Stroke) -> Day:
        """Adiciona ou atualiza um traço específico de forma idempotente."""
        pass

    @abstractmethod
    async def delete_stroke(self, user_id: str, date_key: str, stroke_id: UUID) -> Optional[Day]:
        """Remove um traço do dia correspondente."""
        pass

    @abstractmethod
    async def clear_strokes(self, user_id: str, date_key: str, container_type: Optional[str] = None) -> Day:
        """Remove todos os traços do dia ou filtra por tipo de container."""
        pass

    @abstractmethod
    async def upsert_todo(self, user_id: str, date_key: str, todo: TodoItem) -> Day:
        """Adiciona ou atualiza um todo item de forma idempotente."""
        pass

    @abstractmethod
    async def delete_todo(self, user_id: str, date_key: str, todo_id: UUID) -> Optional[Day]:
        """Remove uma tarefa e seus traços associados."""
        pass
