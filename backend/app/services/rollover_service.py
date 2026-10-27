from datetime import datetime, timedelta, timezone
from typing import Dict, Any
from uuid import uuid4
import pytz
from app.core.config import settings
from app.models.day import Day, Stroke, TodoItem
from app.repositories.day_repository_interface import IDayRepository

class RolloverService:
    def __init__(self, repository: IDayRepository):
        self.repository = repository

    async def execute_rollover(self, user_id: str, target_date_key: str = None) -> Dict[str, Any]:
        """
        Executa a migração de tarefas não concluídas do dia anterior para o dia atual.
        Se target_date_key não for informado, assume a data atual no fuso de São Paulo.
        """
        tz = pytz.timezone(settings.TIMEZONE)
        now_local = datetime.now(tz)

        if not target_date_key:
            target_date_key = now_local.strftime("%Y-%m-%d")

        # Calcula a data do dia anterior
        target_date = datetime.strptime(target_date_key, "%Y-%m-%d").date()
        yesterday_date = target_date - timedelta(days=1)
        yesterday_key = yesterday_date.strftime("%Y-%m-%d")

        # 1. Busca documento do dia anterior
        yesterday_day = await Day.find_one({"user_id": user_id, "date_key": yesterday_key})
        if not yesterday_day or not yesterday_day.todos:
            return {
                "user_id": user_id,
                "status": "no_pending_todos",
                "yesterday_key": yesterday_key,
                "target_date_key": target_date_key,
                "migrated_count": 0
            }

        # 2. Filtra tarefas pendentes
        pending_todos = [t for t in yesterday_day.todos if not t.completed]
        if not pending_todos:
            return {
                "user_id": user_id,
                "status": "all_completed",
                "yesterday_key": yesterday_key,
                "target_date_key": target_date_key,
                "migrated_count": 0
            }

        # 3. Obtém ou cria o documento do dia de destino
        today_day = await self.repository.get_or_create(user_id, target_date_key)

        migrated_todos = []
        migrated_strokes = []

        now_utc = datetime.now(timezone.utc)

        for old_todo in pending_todos:
            # Cria novo todo clonado para hoje
            new_todo_id = uuid4()
            new_todo = TodoItem(
                todo_id=new_todo_id,
                completed=False,
                title=old_todo.title,
                order=len(today_day.todos) + len(migrated_todos),
                google_task_id=old_todo.google_task_id,
                created_at=now_utc
            )
            migrated_todos.append(new_todo)

            # Migra traços manuscritos que pertenciam a esse todo
            old_strokes = [s for s in yesterday_day.strokes if s.todo_id == old_todo.todo_id]
            for s in old_strokes:
                cloned_stroke = Stroke(
                    stroke_id=uuid4(),
                    container_type=s.container_type,
                    todo_id=new_todo_id,
                    color=s.color,
                    size=s.size,
                    points=s.points,
                    created_at=now_utc
                )
                migrated_strokes.append(cloned_stroke)

        today_day.todos.extend(migrated_todos)
        today_day.strokes.extend(migrated_strokes)
        today_day.updated_at = now_utc
        await self.repository.save(today_day)

        return {
            "user_id": user_id,
            "status": "success",
            "yesterday_key": yesterday_key,
            "target_date_key": target_date_key,
            "migrated_todos": len(migrated_todos),
            "migrated_strokes": len(migrated_strokes)
        }

