from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List
import json
import asyncio
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.session_data: Dict[str, Dict] = {}
    
    async def connect(self, websocket: WebSocket, session_id: str):
        """Accept WebSocket connection and store session"""
        await websocket.accept()
        self.active_connections[session_id] = websocket
        self.session_data[session_id] = {
            "connected_at": datetime.now().isoformat(),
            "last_activity": datetime.now().isoformat()
        }
        logger.info(f"WebSocket connected for session: {session_id}")
        
        # Send welcome message
        await self.send_personal_message(json.dumps({
            "type": "connection_established",
            "session_id": session_id,
            "message": "Connected to See Like Me backend",
            "timestamp": datetime.now().isoformat()
        }), session_id)
    
    def disconnect(self, session_id: str):
        """Remove WebSocket connection"""
        if session_id in self.active_connections:
            del self.active_connections[session_id]
        if session_id in self.session_data:
            del self.session_data[session_id]
        logger.info(f"WebSocket disconnected for session: {session_id}")
    
    async def send_personal_message(self, message: str, session_id: str):
        """Send message to specific session"""
        if session_id in self.active_connections:
            try:
                await self.active_connections[session_id].send_text(message)
                # Update last activity
                if session_id in self.session_data:
                    self.session_data[session_id]["last_activity"] = datetime.now().isoformat()
            except Exception as e:
                logger.error(f"Failed to send message to {session_id}: {str(e)}")
                self.disconnect(session_id)
    
    async def send_detection_update(self, session_id: str, detection_results: Dict):
        """Send detection results update to Chrome extension"""
        if session_id in self.active_connections:
            try:
                message = {
                    "type": "detection_complete",
                    "session_id": session_id,
                    "results": detection_results,
                    "model_info": {
                        "dyslexia_accuracy": detection_results["dyslexia"].get("accuracy", 0),
                        "adhd_accuracy": detection_results["adhd"].get("accuracy", 0),
                        "autism_method": detection_results["autism"].get("method", "enhanced_hybrid")
                    },
                    "timestamp": datetime.now().isoformat()
                }
                
                await self.active_connections[session_id].send_text(json.dumps(message))
                logger.info(f"Detection update sent to session: {session_id}")
                
            except Exception as e:
                logger.error(f"Failed to send detection update to {session_id}: {str(e)}")
                self.disconnect(session_id)
    
    async def send_simulation_config(self, session_id: str, config: Dict):
        """Send simulation configuration to Chrome extension"""
        if session_id in self.active_connections:
            try:
                message = {
                    "type": "simulation_config",
                    "session_id": session_id,
                    "config": config,
                    "timestamp": datetime.now().isoformat()
                }
                
                await self.active_connections[session_id].send_text(json.dumps(message))
                logger.info(f"Simulation config sent to session: {session_id}")
                
            except Exception as e:
                logger.error(f"Failed to send simulation config to {session_id}: {str(e)}")
                self.disconnect(session_id)
    
    async def broadcast_system_message(self, message: Dict):
        """Broadcast system message to all connected sessions"""
        disconnected_sessions = []
        
        message["type"] = "system_broadcast"
        message["timestamp"] = datetime.now().isoformat()
        
        for session_id, websocket in self.active_connections.items():
            try:
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Failed to broadcast to {session_id}: {str(e)}")
                disconnected_sessions.append(session_id)
        
        # Clean up disconnected sessions
        for session_id in disconnected_sessions:
            self.disconnect(session_id)
    
    def get_active_sessions(self) -> List[str]:
        """Get list of active session IDs"""
        return list(self.active_connections.keys())
    
    def get_session_count(self) -> int:
        """Get number of active sessions"""
        return len(self.active_connections)
    
    def get_session_info(self, session_id: str) -> Dict:
        """Get session information"""
        return self.session_data.get(session_id, {})
