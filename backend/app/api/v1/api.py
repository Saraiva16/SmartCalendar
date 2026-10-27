from fastapi import APIRouter
from app.api.v1.endpoints import days, rollover, google

api_router = APIRouter()
api_router.include_router(days.router)
api_router.include_router(rollover.router)
api_router.include_router(google.router)
