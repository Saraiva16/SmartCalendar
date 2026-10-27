from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Whiteboard Calendar API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    MONGODB_URL: str = "mongodb://mongo:27017"
    DATABASE_NAME: str = "smart_calendar"
    
    TIMEZONE: str = "America/Sao_Paulo"
    DEFAULT_USER_ID: str = "matheus_owner"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

settings = Settings()
