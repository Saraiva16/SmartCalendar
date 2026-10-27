from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.api.deps import get_current_user_id, get_day_service
from app.schemas.day import (
    BatchStrokesDTO,
    DayResponseDTO,
    StrokeCreateDTO,
    TodoCreateDTO,
    TodoUpdateDTO,
)
from app.services.day_service import DayService

router = APIRouter(prefix="/days", tags=["Days & Whiteboard"])

@router.get(
    "/{date_key}",
    response_model=DayResponseDTO,
    summary="Obter dados e traços do dia",
    description="Retorna traços, tarefas e metadados de uma data específica ('YYYY-MM-DD'). Cria o registro caso não exista."
)
async def get_day(
    date_key: str,
    user_id: str = Depends(get_current_user_id),
    service: DayService = Depends(get_day_service)
):
    day = await service.get_day(user_id=user_id, date_key=date_key)
    return day

@router.get(
    "",
    response_model=List[DayResponseDTO],
    summary="Buscar dias por intervalo",
    description="Útil para carregar a visão semanal (7 dias) ou a visão mensal (35-42 dias)."
)
async def get_days_range(
    start_date: str = Query(..., description="Data inicial no formato YYYY-MM-DD"),
    end_date: str = Query(..., description="Data final no formato YYYY-MM-DD"),
    user_id: str = Depends(get_current_user_id),
    service: DayService = Depends(get_day_service)
):
    return await service.get_range(user_id=user_id, start_date=start_date, end_date=end_date)

# --- Strokes Endpoints ---

@router.put(
    "/{date_key}/strokes",
    response_model=DayResponseDTO,
    summary="Adicionar ou atualizar um traço (Idempotente)",
    description="Persiste um traço à mão livre normalizado. Se o stroke_id já existir, substitui os pontos."
)
async def upsert_stroke(
    date_key: str,
    dto: StrokeCreateDTO,
    user_id: str = Depends(get_current_user_id),
    service: DayService = Depends(get_day_service)
):
    return await service.add_or_update_stroke(user_id=user_id, date_key=date_key, dto=dto)

@router.post(
    "/{date_key}/strokes/sync",
    response_model=DayResponseDTO,
    summary="Sincronizar lote de traços offline",
    description="Endpoint otimizado para o debounce do Dexie.js sincronizar múltiplos traços desenhados."
)
async def sync_strokes(
    date_key: str,
    dto: BatchStrokesDTO,
    user_id: str = Depends(get_current_user_id),
    service: DayService = Depends(get_day_service)
):
    return await service.sync_strokes_batch(user_id=user_id, date_key=date_key, strokes_dtos=dto.strokes)

@router.delete(
    "/{date_key}/strokes/{stroke_id}",
    response_model=DayResponseDTO,
    summary="Apagar um traço individual",
    description="Utilizado pela borracha (Eraser) para remover o traço identificado."
)
async def delete_stroke(
    date_key: str,
    stroke_id: UUID,
    user_id: str = Depends(get_current_user_id),
    service: DayService = Depends(get_day_service)
):
    day = await service.remove_stroke(user_id=user_id, date_key=date_key, stroke_id=stroke_id)
    if not day:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dia ou traço não encontrado")
    return day

@router.delete(
    "/{date_key}/strokes",
    response_model=DayResponseDTO,
    summary="Limpar tela / container de traços",
    description="Limpa todos os traços do dia ou apenas os traços de um containerType específico (ex: 'day_notes')."
)
async def clear_strokes(
    date_key: str,
    container_type: Optional[str] = Query(None, description="Filtro opcional por tipo de container"),
    user_id: str = Depends(get_current_user_id),
    service: DayService = Depends(get_day_service)
):
    return await service.clear_canvas(user_id=user_id, date_key=date_key, container_type=container_type)

# --- Todos Endpoints ---

@router.post(
    "/{date_key}/todos",
    response_model=DayResponseDTO,
    status_code=status.HTTP_201_CREATED,
    summary="Criar ou adicionar tarefa à data",
    description="Adiciona um novo checkbox interativo (com suporte a título textual ou manuscrito)."
)
async def create_todo(
    date_key: str,
    dto: TodoCreateDTO,
    user_id: str = Depends(get_current_user_id),
    service: DayService = Depends(get_day_service)
):
    return await service.add_or_update_todo(user_id=user_id, date_key=date_key, dto=dto)

@router.patch(
    "/{date_key}/todos/{todo_id}",
    response_model=DayResponseDTO,
    summary="Atualizar estado da tarefa (ex: alternar concluído)",
    description="Permite alternar o status do checkbox ('completed'), atualizar título ou reordenar."
)
async def patch_todo(
    date_key: str,
    todo_id: UUID,
    dto: TodoUpdateDTO,
    user_id: str = Depends(get_current_user_id),
    service: DayService = Depends(get_day_service)
):
    day = await service.patch_todo(user_id=user_id, date_key=date_key, todo_id=todo_id, dto=dto)
    if not day:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarefa não encontrada")
    return day

@router.delete(
    "/{date_key}/todos/{todo_id}",
    response_model=DayResponseDTO,
    summary="Remover tarefa",
    description="Remove a tarefa e limpa automaticamente qualquer traço manuscrito associado a ela."
)
async def delete_todo(
    date_key: str,
    todo_id: UUID,
    user_id: str = Depends(get_current_user_id),
    service: DayService = Depends(get_day_service)
):
    day = await service.remove_todo(user_id=user_id, date_key=date_key, todo_id=todo_id)
    if not day:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarefa não encontrada")
    return day
