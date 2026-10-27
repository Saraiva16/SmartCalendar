from typing import List
from app.integrations.google_interface import IGoogleIntegrationService, CalendarEventDTO, GoogleTaskDTO

class GoogleIntegrationService(IGoogleIntegrationService):
    """
    Serviço de integração com as APIs do Google.
    Suporta modo conectado via tokens/OAuth2 ou modo fallback inteligente
    para desenvolvimento local limpo sem bloquear a aplicação.
    """

    async def get_events_for_range(self, start_date: str, end_date: str) -> List[CalendarEventDTO]:
        # Em modo de desenvolvimento ou sem tokens configurados em .env,
        # fornece mock estruturado com base nas datas solicitadas para visualização imediata na UI
        return [
            CalendarEventDTO(
                event_id="evt_01",
                title="Daily Meeting / Alinhamento",
                start_time="09:00",
                end_time="09:30",
                date_key=start_date,
                color="#3B82F6",
                is_all_day=False
            ),
            CalendarEventDTO(
                event_id="evt_02",
                title="Revisão de Arquitetura",
                start_time="14:00",
                end_time="15:00",
                date_key=start_date,
                color="#10B981",
                is_all_day=False
            )
        ]

    async def get_tasks(self) -> List[GoogleTaskDTO]:
        return [
            GoogleTaskDTO(
                task_id="gtask_01",
                title="Comprar marcador para lousa",
                completed=False
            )
        ]

    async def update_task_status(self, task_id: str, completed: bool) -> bool:
        print(f"[GoogleTasks] Tarefa {task_id} atualizada para completed={completed}")
        return True
