import numpy as np
import pandas as pd
from typing import Dict, Any, List
import logging

logger = logging.getLogger(__name__)

class DataPreprocessor:
    def __init__(self):
        self.scalers = {}
        self.encoders = {}
    
    def preprocess_dyslexia_features(self, features: Dict[str, float]) -> np.ndarray:
        """Preprocess dyslexia assessment features"""
        try:
            # Normalize features to expected ranges
            normalized_features = {
                'reading_speed': max(0, min(features.get('reading_speed', 0), 300)) / 300,
                'comprehension_score': max(0, min(features.get('comprehension_score', 0), 100)) / 100,
                'spelling_accuracy': max(0, min(features.get('spelling_accuracy', 0), 100)) / 100,
                'phonemic_awareness': max(0, min(features.get('phonemic_awareness', 0), 10)) / 10,
                'working_memory': max(0, min(features.get('working_memory', 0), 10)) / 10
            }
            
            return np.array(list(normalized_features.values()))
            
        except Exception as e:
            logger.error(f"Dyslexia preprocessing failed: {str(e)}")
            return np.array([0.5, 0.5, 0.5, 0.5, 0.5])  # Default values
    
    def preprocess_adhd_features(self, features: Dict[str, float]) -> np.ndarray:
        """Preprocess ADHD assessment features"""
        try:
            # Normalize features to expected ranges
            normalized_features = {
                'attention_span': max(0, min(features.get('attention_span', 0), 60)) / 60,
                'hyperactivity_level': max(1, min(features.get('hyperactivity_level', 1), 10)) / 10,
                'impulsivity_score': max(1, min(features.get('impulsivity_score', 1), 10)) / 10,
                'focus_duration': max(0, min(features.get('focus_duration', 0), 120)) / 120,
                'task_completion': max(0, min(features.get('task_completion', 0), 100)) / 100
            }
            
            return np.array(list(normalized_features.values()))
            
        except Exception as e:
            logger.error(f"ADHD preprocessing failed: {str(e)}")
            return np.array([0.5, 0.5, 0.5, 0.5, 0.5])  # Default values
    
    def preprocess_autism_assessment(self, assessment: Dict[str, int]) -> Dict[str, int]:
        """Preprocess autism assessment data"""
        try:
            # Ensure all values are in valid range (1-5)
            processed_assessment = {}
            
            for key, value in assessment.items():
                processed_value = max(1, min(int(value), 5))
                processed_assessment[key] = processed_value
            
            return processed_assessment
            
        except Exception as e:
            logger.error(f"Autism preprocessing failed: {str(e)}")
            return {key: 3 for key in assessment.keys()}  # Default middle values
    
    def validate_input_data(self, data: Dict[str, Any], data_type: str) -> bool:
        """Validate input data for different disability types"""
        try:
            if data_type == 'dyslexia':
                required_fields = ['reading_speed', 'comprehension_score', 'spelling_accuracy', 
                                 'phonemic_awareness', 'working_memory']
                return all(field in data for field in required_fields)
            
            elif data_type == 'adhd':
                required_fields = ['attention_span', 'hyperactivity_level', 'impulsivity_score',
                                 'focus_duration', 'task_completion']
                return all(field in data for field in required_fields)
            
            elif data_type == 'autism':
                required_fields = ['light_sensitivity', 'sound_sensitivity', 'texture_sensitivity',
                                 'eye_contact_difficulty', 'social_interaction_challenges',
                                 'routine_importance', 'change_resistance']
                return all(field in data for field in required_fields)
            
            return False
            
        except Exception as e:
            logger.error(f"Input validation failed: {str(e)}")
            return False
