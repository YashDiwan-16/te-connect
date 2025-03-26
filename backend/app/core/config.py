import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # API settings
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "Customer Risk Prediction API"
    
    # CORS settings
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "https://yourdomain.com"]
    
    # Database settings
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./app.db")
    
    # ML model settings
    MODEL_PATH: str = os.getenv("MODEL_PATH", "./data/risk_model.pkl")
    
    # Data path
    DATA_DIR: str = os.getenv("DATA_DIR", "./data")
    
    class Config:
        env_file = ".env"

settings = Settings()