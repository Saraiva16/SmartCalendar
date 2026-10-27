from typing import Optional
from fastapi import APIRouter, Depends, Query
from app.api.deps import get_current_user_id, get_day_repository
from app.repositories.day_repository_interface import IDayRepository
from app.services.rollover_service import RolloverService

router = APIRouter(prefix="/rollover", tags=["Midnight Rollover"])

@router.post(
    "/trigger",
    summary="Disparar manualmente o Midnight Rollover",
    description="Útil para testes ou sincronização sob demanda. Migra tarefas não concluídas do dia anterior."
)
async def trigger_rollover(
    target_date_key: Optional[str] = Query(None, description="Data de destino YYYY-MM-DD (padrão: hoje SP)"),
    user_id: str = Depends(get_current_user_id),
    repo: IDayRepository = Depends(get_day_repository)
):
    service = RolloverService(repository=repo)
    return await service.execute_rollover(user_id=user_id, target_date_key=target_date_key)
