from pydantic_settings import BaseSettings  # FIXED IMPORT
from typing import Optional, List

class Settings(BaseSettings):
    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "See Like Me Backend"
    VERSION: str = "3.0.0"
    
    # Redis Configuration
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: Optional[str] = None
    REDIS_DB: int = 0
    
    # Model Configuration
    MODEL_PATH: str = "models/"
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    
    # Your specific model files - ALL THREE MODELS
    ADHD_MODEL_FILE: str = "production_adhd_model_20250626_070254.pkl"
    DYSLEXIA_ENSEMBLE_FILE: str = "dyslexia_ultimate_ensemble_20250626_042544.pkl"
    DYSLEXIA_PREPROCESSING_FILE: str = "dyslexia_preprocessing_20250626_042544.pkl"
    DYSLEXIA_NN_FILE: str = "dyslexia_ultimate_nn_20250626_042544.h5"
    AUTISM_HYBRID_FILE: str = "production_autism_hybrid_enhanced_20250626_074724.pkl"
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "chrome-extension://*",
        "http://localhost:3000",
        "http://localhost:8080",
        "https://*.vercel.app",
        "https://*.netlify.app"
    ]
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    # Session Configuration
    SESSION_TIMEOUT: int = 3600  # 1 hour
    
    # Model Performance Thresholds
    DYSLEXIA_HIGH_CONFIDENCE: float = 0.85
    ADHD_HIGH_CONFIDENCE: float = 0.8
    AUTISM_HIGH_CONFIDENCE: float = 0.8
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
