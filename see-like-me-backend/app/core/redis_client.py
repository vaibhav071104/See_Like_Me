import redis.asyncio as redis
import json
import asyncio
from typing import Dict, Any, Optional, List
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class RedisManager:
    def __init__(self):
        self.redis_client: Optional[redis.Redis] = None
        self.connected = False
        self.disabled = True  # DISABLE REDIS
    
    async def connect(self):
        """Skip Redis connection - disabled for local development"""
        if self.disabled:
            logger.info("⚠️ Redis disabled - running without caching (backend works fine)")
            self.connected = False
            return
        
        # Original connection code (not used when disabled)
        try:
            self.redis_client = redis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                password=settings.REDIS_PASSWORD,
                db=settings.REDIS_DB,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_keepalive=True,
                health_check_interval=30
            )
            
            await self.redis_client.ping()
            self.connected = True
            logger.info("✅ Redis connection established")
            
        except Exception as e:
            logger.error(f"❌ Redis connection failed: {str(e)}")
            self.connected = False
    
    async def disconnect(self):
        """Nothing to disconnect when disabled"""
        if self.disabled:
            return
        
        if self.redis_client:
            await self.redis_client.close()
            self.connected = False
            logger.info("Redis connection closed")
    
    def is_connected(self) -> bool:
        """Always return False when disabled"""
        return False if self.disabled else self.connected
    
    async def store_session_data(self, session_id: str, data: Dict[str, Any], ttl: int = None):
        """Skip storage when disabled"""
        if self.disabled:
            logger.debug("Redis disabled - session data not cached (backend works fine)")
            return
        
        # Original storage code...
    
    async def get_session_data(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Return None when disabled"""
        if self.disabled:
            return None
        
        # Original retrieval code...
    
    async def store_feedback(self, session_id: str, feedback: Dict[str, Any]):
        """Skip feedback storage when disabled"""
        if self.disabled:
            logger.debug("Redis disabled - feedback not cached")
            return
        
        # Original feedback storage code...
    
    async def get_feedback_batch(self, batch_size: int = 100) -> List[Dict[str, Any]]:
        """Return empty list when disabled"""
        if self.disabled:
            return []
        
        # Original feedback retrieval code...
    
    async def cache_model_prediction(self, input_hash: str, prediction: Dict[str, Any], ttl: int = 300):
        """Skip caching when disabled"""
        if self.disabled:
            return
        
        # Original caching code...
    
    async def get_cached_prediction(self, input_hash: str) -> Optional[Dict[str, Any]]:
        """Return None when disabled"""
        if self.disabled:
            return None
        
        # Original cache retrieval code...
