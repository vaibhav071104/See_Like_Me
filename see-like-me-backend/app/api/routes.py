from fastapi import APIRouter, Form, HTTPException
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "See Like Me API Routes",
        "version": "3.0.0"
    }

@router.post("/test")
async def test_endpoint(
    test_data: str = Form(..., description="Test data")
):
    """Test endpoint for API validation"""
    return {
        "status": "success",
        "message": "API routes working correctly",
        "received_data": test_data
    }
