from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID
from app.models.day import Day, Stroke, TodoItem, ContainerType
from app.repositories.day_repository_interface import IDayRepository
from app.schemas.day import StrokeCreateDTO, TodoCreateDTO, TodoUpdateDTO

class DayService:
    def __init__(self, repository: IDayRepository):
        self.repository = repository

    async def get_day(self, user_id: str, date_key: str) -> Day:
        return await self.repository.get_or_create(user_id, date_key)

    async def get_range(self, user_id: str, start_date: str, end_date: str) -> List[Day]:
        return await self.repository.get_by_date_range(user_id, start_date, end_date)

    async def add_or_update_stroke(self, user_id: str, date_key: str, dto: StrokeCreateDTO) -> Day:
        stroke = Stroke(
            stroke_id=dto.stroke_id,
            container_type=ContainerType(dto.container_type.value),
            todo_id=dto.todo_id,
            color=dto.color,
            size=dto.size,
            points=dto.points,
            created_at=datetime.now(timezone.utc)
        )
        return await self.repository.upsert_stroke(user_id, date_key, stroke)

    async def sync_strokes_batch(self, user_id: str, date_key: str, strokes_dtos: List[StrokeCreateDTO]) -> Day:
        day = await self.repository.get_or_create(user_id, date_key)
        for dto in strokes_dtos:
            stroke = Stroke(
                stroke_id=dto.stroke_id,
                container_type=ContainerType(dto.container_type.value),
                todo_id=dto.todo_id,
                color=dto.color,
                size=dto.size,
                points=dto.points,
                created_at=datetime.now(timezone.utc)
            )
            existing_idx = next((i for i, s in enumerate(day.strokes) if s.stroke_id == stroke.stroke_id), None)
            if existing_idx is not None:
                day.strokes[existing_idx] = stroke
            else:
                day.strokes.append(stroke)
        return await self.repository.save(day)

    async def remove_stroke(self, user_id: str, date_key: str, stroke_id: UUID) -> Optional[Day]:
        return await self.repository.delete_stroke(user_id, date_key, stroke_id)

    async def clear_canvas(self, user_id: str, date_key: str, container_type: Optional[str] = None) -> Day:
        return await self.repository.clear_strokes(user_id, date_key, container_type)

    async def add_or_update_todo(self, user_id: str, date_key: str, dto: TodoCreateDTO) -> Day:
        now = datetime.now(timezone.utc)
        todo = TodoItem(
            todo_id=dto.todo_id,
            completed=dto.completed,
            title=dto.title,
            order=dto.order,
            google_task_id=dto.google_task_id,
            created_at=now,
            completed_at=now if dto.completed else None
        )
        return await self.repository.upsert_todo(user_id, date_key, todo)

    async def patch_todo(self, user_id: str, date_key: str, todo_id: UUID, dto: TodoUpdateDTO) -> Optional[Day]:
        day = await self.repository.get_or_create(user_id, date_key)
        existing = next((t for t in day.todos if t.todo_id == todo_id), None)
        if not existing:
            return None

        if dto.completed is not None:
            existing.completed = dto.completed
            existing.completed_at = datetime.now(timezone.utc) if dto.completed else None
        if dto.title is not None:
            existing.title = dto.title
        if dto.order is not None:
            existing.order = dto.order
        if dto.google_task_id is not None:
            existing.google_task_id = dto.google_task_id

        return await self.repository.save(day)

    async def remove_todo(self, user_id: str, date_key: str, todo_id: UUID) -> Optional[Day]:
        return await self.repository.delete_todo(user_id, date_key, todo_id)
