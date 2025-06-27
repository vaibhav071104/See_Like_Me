from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import asyncio
import json
import os
from typing import Dict, List, Optional
import logging
from datetime import datetime

from app.models.disability_detector import DisabilityDetectionSystem
from app.core.redis_client import RedisManager
from app.api.websocket import ConnectionManager
from app.core.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="See Like Me - Disability Simulation API",
    description="AI-powered disability detection and simulation backend",
    version="3.0.0"
)

# CORS middleware for Chrome extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["chrome-extension://*", "http://localhost:*", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize systems
detector = DisabilityDetectionSystem()
redis_manager = RedisManager()
connection_manager = ConnectionManager()

@app.on_event("startup")
async def startup_event():
    """Initialize backend services with your specific models"""
    logger.info("🚀 Starting See Like Me Backend with your optimized models...")
    
    # Verify your model files exist
    required_files = [
        'models/compatible_adhd_model.pkl',
        'models/compatible_dyslexia_model.pkl',
        'models/compatible_dyslexia_preprocessing.pkl',
        'models/compatible_autism_model.pkl'
    ]
    
    missing_files = []
    for file_path in required_files:
        if not os.path.exists(file_path):
            missing_files.append(file_path)
    
    if missing_files:
        logger.error(f"❌ Missing model files: {missing_files}")
        logger.error("💡 Did you run retrain_compatible_models.py first?")
        raise FileNotFoundError(f"Required model files not found: {missing_files}")
    
    # Load your specific models
    await detector.load_models()
    
    # Initialize Redis connection (disabled)
    try:
        await redis_manager.connect()
    except Exception as e:
        logger.warning(f"Redis connection failed: {e}. Running without Redis.")
    
    logger.info("✅ Backend initialized with your optimized models!")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup backend services"""
    logger.info("🛑 Shutting down See Like Me Backend...")
    await redis_manager.disconnect()

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "See Like Me Backend",
        "models_loaded": detector.models_loaded,
        "redis_connected": redis_manager.is_connected(),
        "model_versions": {
            "adhd": "compatible_adhd_model.pkl",
            "dyslexia": "compatible_dyslexia_model.pkl",
            "autism": "compatible_autism_model.pkl"
        }
    }

@app.post("/api/v1/detect/comprehensive")
async def comprehensive_detection(
    # Dyslexia assessment data
    reading_speed: float = Form(..., description="Words per minute"),
    comprehension_score: float = Form(..., description="Percentage 0-100"),
    spelling_accuracy: float = Form(..., description="Percentage 0-100"),
    phonemic_awareness: float = Form(..., description="Score 0-10"),
    working_memory: float = Form(..., description="Score 0-10"),
    
    # ADHD assessment data
    attention_span: float = Form(..., description="Minutes before distraction"),
    hyperactivity_level: float = Form(..., description="Scale 1-10"),
    impulsivity_score: float = Form(..., description="Scale 1-10"),
    focus_duration: float = Form(..., description="Minutes of sustained focus"),
    task_completion: float = Form(..., description="Percentage 0-100"),
    
    # Autism assessment data
    light_sensitivity: int = Form(..., description="Scale 1-5"),
    sound_sensitivity: int = Form(..., description="Scale 1-5"),
    texture_sensitivity: int = Form(..., description="Scale 1-5"),
    eye_contact_difficulty: int = Form(..., description="Scale 1-5"),
    social_interaction_challenges: int = Form(..., description="Scale 1-5"),
    routine_importance: int = Form(..., description="Scale 1-5"),
    change_resistance: int = Form(..., description="Scale 1-5"),
    
    # Session management
    session_id: str = Form(..., description="Unique session identifier"),
    user_age: Optional[int] = Form(None, description="User age for calibration")
):
    """Comprehensive disability detection endpoint using your optimized models"""
    try:
        logger.info(f"Processing comprehensive detection for session: {session_id}")
        
        # Prepare assessment data
        dyslexia_features = {
            'reading_speed': reading_speed,
            'comprehension_score': comprehension_score,
            'spelling_accuracy': spelling_accuracy,
            'phonemic_awareness': phonemic_awareness,
            'working_memory': working_memory
        }
        
        adhd_features = {
            'attention_span': attention_span,
            'hyperactivity_level': hyperactivity_level,
            'impulsivity_score': impulsivity_score,
            'focus_duration': focus_duration,
            'task_completion': task_completion
        }
        
        autism_assessment = {
            'light_sensitivity': light_sensitivity,
            'sound_sensitivity': sound_sensitivity,
            'texture_sensitivity': texture_sensitivity,
            'eye_contact_difficulty': eye_contact_difficulty,
            'social_interaction_challenges': social_interaction_challenges,
            'routine_importance': routine_importance,
            'change_resistance': change_resistance
        }
        
        # Run detection with your optimized models
        results = await detector.detect_all_disabilities(
            dyslexia_features=dyslexia_features,
            adhd_features=adhd_features,
            autism_assessment=autism_assessment,
            user_age=user_age
        )
        
        # Store results in Redis for session management
        await redis_manager.store_session_data(session_id, results)
        
        # Send real-time updates via WebSocket
        await connection_manager.send_detection_update(session_id, results)
        
        # Generate simulation configuration
        simulation_config = await generate_simulation_config(results)
        
        return {
            "status": "success",
            "session_id": session_id,
            "detection_results": results,
            "simulation_config": simulation_config,
            "model_info": {
                "adhd_accuracy": results["adhd"].get("accuracy", 0),
                "dyslexia_accuracy": results["dyslexia"].get("accuracy", 0),
                "autism_method": results["autism"].get("method", "compatible_ml_ensemble")
            },
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Detection failed for session {session_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def generate_simulation_config(detection_results: Dict) -> Dict:
    """Generate Chrome extension simulation configuration"""
    config = {
        "dyslexia": {
            "enabled": detection_results.get("dyslexia", {}).get("prediction", 0) == 1,
            "intensity": detection_results.get("dyslexia", {}).get("simulation_strength", "none"),
            "confidence": detection_results.get("dyslexia", {}).get("confidence", 0.0),
            "settings": {
                "letter_spacing": "3px" if detection_results.get("dyslexia", {}).get("confidence", 0) > 0.8 else "2px",
                "line_height": "2.0" if detection_results.get("dyslexia", {}).get("confidence", 0) > 0.7 else "1.6",
                "font_family": "OpenDyslexic, Arial, sans-serif",
                "text_shimmer": detection_results.get("dyslexia", {}).get("confidence", 0) > 0.6,
                "word_spacing": "0.3em" if detection_results.get("dyslexia", {}).get("confidence", 0) > 0.5 else "0.1em"
            }
        },
        "adhd": {
            "enabled": detection_results.get("adhd", {}).get("prediction", 0) == 1 and detection_results.get("adhd", {}).get("confidence", 0) > 0.6,
            "intensity": detection_results.get("adhd", {}).get("simulation_strength", "none"),
            "confidence": detection_results.get("adhd", {}).get("confidence", 0.0),
            "settings": {
                "distraction_blur": f"{detection_results.get('adhd', {}).get('confidence', 0) * 4}px",
                "focus_highlight": detection_results.get("adhd", {}).get("confidence", 0) > 0.7,
                "animation_speed": "slow" if detection_results.get("adhd", {}).get("confidence", 0) > 0.6 else "normal",
                "attention_overlay": detection_results.get("adhd", {}).get("confidence", 0) > 0.8,
                "scroll_sensitivity": detection_results.get("adhd", {}).get("confidence", 0) * 2
            }
        },
        "autism": {
            "enabled": detection_results.get("autism", {}).get("prediction", 0) == 1,
            "intensity": detection_results.get("autism", {}).get("simulation_strength", "none"),
            "confidence": detection_results.get("autism", {}).get("confidence", 0.0),
            "settings": {
                "brightness_reduction": detection_results.get("autism", {}).get("confidence", 0) * 0.4,
                "contrast_reduction": detection_results.get("autism", {}).get("confidence", 0) * 0.3,
                "animation_slowdown": detection_results.get("autism", {}).get("confidence", 0) * 3,
                "sensory_filtering": detection_results.get("autism", {}).get("confidence", 0) > 0.5,
                "color_temperature": "warm" if detection_results.get("autism", {}).get("confidence", 0) > 0.6 else "normal"
            }
        },
        "global_settings": {
            "simulation_intensity": max(
                detection_results.get("dyslexia", {}).get("confidence", 0),
                detection_results.get("adhd", {}).get("confidence", 0),
                detection_results.get("autism", {}).get("confidence", 0)
            ),
            "primary_disability": max(
                detection_results.items(),
                key=lambda x: x[1].get("confidence", 0) if isinstance(x[1], dict) else 0
            )[0] if detection_results else "none"
        }
    }
    
    return config

@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for real-time communication with Chrome extension"""
    await connection_manager.connect(websocket, session_id)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message["type"] == "simulation_feedback":
                await redis_manager.store_feedback(session_id, message["feedback"])
                await websocket.send_text(json.dumps({
                    "type": "feedback_received",
                    "message": "Thank you for your feedback!"
                }))
                
            elif message["type"] == "request_update":
                session_data = await redis_manager.get_session_data(session_id)
                if session_data:
                    config = await generate_simulation_config(session_data)
                    await websocket.send_text(json.dumps({
                        "type": "simulation_update",
                        "config": config
                    }))
                    
            elif message["type"] == "toggle_simulation":
                await websocket.send_text(json.dumps({
                    "type": "simulation_toggled",
                    "disability": message.get("disability"),
                    "enabled": message.get("enabled")
                }))
                    
    except WebSocketDisconnect:
        connection_manager.disconnect(session_id)
        logger.info(f"WebSocket disconnected for session: {session_id}")

@app.get("/api/v1/session/{session_id}")
async def get_session_data(session_id: str):
    """Retrieve session data for Chrome extension"""
    try:
        session_data = await redis_manager.get_session_data(session_id)
        if session_data:
            return {
                "status": "success",
                "session_data": session_data,
                "simulation_config": await generate_simulation_config(session_data)
            }
        else:
            raise HTTPException(status_code=404, detail="Session not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/feedback")
async def submit_feedback(
    session_id: str = Form(...),
    disability_type: str = Form(...),
    accuracy_rating: int = Form(..., ge=1, le=5),
    simulation_quality: int = Form(..., ge=1, le=5),
    comments: str = Form(None)
):
    """Submit user feedback for model improvement"""
    try:
        feedback_data = {
            "disability_type": disability_type,
            "accuracy_rating": accuracy_rating,
            "simulation_quality": simulation_quality,
            "comments": comments,
            "timestamp": datetime.now().isoformat()
        }
        
        await redis_manager.store_feedback(session_id, feedback_data)
        
        return {
            "status": "success",
            "message": "Feedback submitted successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/models/info")
async def get_model_info():
    """Get information about your loaded models"""
    return {
        "models_loaded": detector.models_loaded,
        "model_files": {
            "adhd_production": "compatible_adhd_model.pkl",
            "dyslexia_ensemble": "compatible_dyslexia_model.pkl",
            "dyslexia_preprocessing": "compatible_dyslexia_preprocessing.pkl", 
            "autism_hybrid": "compatible_autism_model.pkl"
        },
        "model_accuracies": {
            "dyslexia": "90%+ (Compatible ML ensemble)",
            "adhd": "75%+ (Compatible ML ensemble)",
            "autism": "85%+ (Compatible ML ensemble)"
        },
        "training_date": "2025-06-26",
        "ready_for_chrome_extension": True,
        "optimization_method": {
            "adhd": "Retrained compatible ensemble",
            "dyslexia": "Retrained compatible ensemble",
            "autism": "Retrained compatible ensemble"
        }
    }

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
