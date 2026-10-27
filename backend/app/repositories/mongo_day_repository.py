from datetime import datetime, timezone
from typing import Optional, List
from uuid import UUID
from app.models.day import Day, Stroke, TodoItem
from app.repositories.day_repository_interface import IDayRepository

class MongoDayRepository(IDayRepository):
    async def get_or_create(self, user_id: str, date_key: str) -> Day:
        day = await Day.find_one({"user_id": user_id, "date_key": date_key})
        if not day:
            now = datetime.now(timezone.utc)
            day = Day(
                user_id=user_id,
                date_key=date_key,
                strokes=[],
                todos=[],
                created_at=now,
                updated_at=now
            )
            await day.insert()
        return day

    async def get_by_date_range(self, user_id: str, start_date: str, end_date: str) -> List[Day]:
        return await Day.find({
            "user_id": user_id,
            "date_key": {"$gte": start_date, "$lte": end_date}
        }).to_list()

    async def save(self, day: Day) -> Day:
        day.updated_at = datetime.now(timezone.utc)
        await day.save()
        return day

    async def upsert_stroke(self, user_id: str, date_key: str, stroke: Stroke) -> Day:
        day = await self.get_or_create(user_id, date_key)
        
        # Substitui traço existente com mesmo ID ou apende novo
        existing_idx = next((i for i, s in enumerate(day.strokes) if s.stroke_id == stroke.stroke_id), None)
        if existing_idx is not None:
            day.strokes[existing_idx] = stroke
        else:
            day.strokes.append(stroke)
            
        day.updated_at = datetime.now(timezone.utc)
        await day.save()
        return day

    async def delete_stroke(self, user_id: str, date_key: str, stroke_id: UUID) -> Optional[Day]:
        day = await Day.find_one({"user_id": user_id, "date_key": date_key})
        if not day:
            return None
            
        initial_len = len(day.strokes)
        day.strokes = [s for s in day.strokes if s.stroke_id != stroke_id]
        if len(day.strokes) != initial_len:
            day.updated_at = datetime.now(timezone.utc)
            await day.save()
        return day

    async def clear_strokes(self, user_id: str, date_key: str, container_type: Optional[str] = None) -> Day:
        day = await self.get_or_create(user_id, date_key)
        if container_type:
            day.strokes = [s for s in day.strokes if s.container_type != container_type]
        else:
            day.strokes = []
        day.updated_at = datetime.now(timezone.utc)
        await day.save()
        return day

    async def upsert_todo(self, user_id: str, date_key: str, todo: TodoItem) -> Day:
        day = await self.get_or_create(user_id, date_key)
        existing_idx = next((i for i, t in enumerate(day.todos) if t.todo_id == todo.todo_id), None)
        if existing_idx is not None:
            day.todos[existing_idx] = todo
        else:
            day.todos.append(todo)
        day.updated_at = datetime.now(timezone.utc)
        await day.save()
        return day

    async def delete_todo(self, user_id: str, date_key: str, todo_id: UUID) -> Optional[Day]:
        day = await Day.find_one({"user_id": user_id, "date_key": date_key})
        if not day:
            return None
        # Remove a tarefa e limpa os traços manuscritos que pertenciam a esse todo_id
        day.todos = [t for t in day.todos if t.todo_id != todo_id]
        day.strokes = [s for s in day.strokes if s.todo_id != todo_id]
        day.updated_at = datetime.now(timezone.utc)
        await day.save()
        return day
