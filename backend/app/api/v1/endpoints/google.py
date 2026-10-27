from typing import List
from fastapi import APIRouter, Depends, Query
from app.api.deps import get_google_service
from app.integrations.google_interface import IGoogleIntegrationService, CalendarEventDTO, GoogleTaskDTO

router = APIRouter(prefix="/google", tags=["Google Calendar & Tasks"])

@router.get(
    "/events",
    response_model=List[CalendarEventDTO],
    summary="Eventos do Google Calendar por intervalo",
    description="Retorna eventos no intervalo especificado para exibição no topo da visão semanal ou diária."
)
async def get_events(
    start_date: str = Query(..., description="Data inicial YYYY-MM-DD"),
    end_date: str = Query(..., description="Data final YYYY-MM-DD"),
    google_service: IGoogleIntegrationService = Depends(get_google_service)
):
    return await google_service.get_events_for_range(start_date=start_date, end_date=end_date)

@router.get(
    "/tasks",
    response_model=List[GoogleTaskDTO],
    summary="Tarefas do Google Tasks",
    description="Consulta tarefas criadas no Google Tasks pelo smartphone."
)
async def get_tasks(
    google_service: IGoogleIntegrationService = Depends(get_google_service)
):
    return await google_service.get_tasks()
