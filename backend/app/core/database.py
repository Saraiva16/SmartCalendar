from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings
from app.models.day import Day

class Database:
    client: AsyncIOMotorClient = None

db = Database()

async def init_db() -> None:
    db.client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(
        database=db.client[settings.DATABASE_NAME],
        document_models=[Day]
    )

async def close_db() -> None:
    if db.client:
        db.client.close()
