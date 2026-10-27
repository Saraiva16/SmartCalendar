from fastapi import Header
from app.core.config import settings
from app.repositories.day_repository_interface import IDayRepository
from app.repositories.mongo_day_repository import MongoDayRepository
from app.services.day_service import DayService

# Injeção singleton do repositório
_day_repository: IDayRepository = MongoDayRepository()

def get_day_repository() -> IDayRepository:
    return _day_repository

def get_day_service() -> DayService:
    return DayService(repository=get_day_repository())

def get_current_user_id(x_user_id: str = Header(default=None)) -> str:
    """Extrai o user_id do cabeçalho HTTP ou recorre ao usuário padrão configurado."""
    return x_user_id or settings.DEFAULT_USER_ID
