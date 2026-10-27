from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from app.core.config import settings
from app.api.deps import get_day_repository
from app.services.rollover_service import RolloverService

scheduler = AsyncIOScheduler()

async def scheduled_midnight_job():
    print(f"[APScheduler] Executando Midnight Rollover para fuso {settings.TIMEZONE}...")
    try:
        repo = get_day_repository()
        service = RolloverService(repository=repo)
        result = await service.execute_rollover(user_id=settings.DEFAULT_USER_ID)
        print(f"[APScheduler] Midnight Rollover concluído: {result}")
    except Exception as e:
        print(f"[APScheduler] Erro ao executar Midnight Rollover: {e}")

def start_scheduler():
    # Executa todo dia à 00:00 no fuso de São Paulo
    trigger = CronTrigger(hour=0, minute=0, timezone=settings.TIMEZONE)
    scheduler.add_job(scheduled_midnight_job, trigger, id="midnight_rollover", replace_existing=True)
    scheduler.start()
    print(f"[APScheduler] Scheduler iniciado com timezone {settings.TIMEZONE}")

def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        print("[APScheduler] Scheduler encerrado")
