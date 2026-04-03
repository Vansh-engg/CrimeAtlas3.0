"""
Model Manager for CI/CD Pipeline
Handles model versioning, deployment, and monitoring
"""

import os
import json
import joblib
import logging
import shutil
from datetime import datetime
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ModelManager:
    def __init__(self, base_dir="models", model_registry="model_registry.json"):
        """Initialize Model Manager for version control"""
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(exist_ok=True)
        
        self.current_models_dir = self.base_dir / "current"
        self.archived_models_dir = self.base_dir / "archived"
        
        self.current_models_dir.mkdir(exist_ok=True)
        self.archived_models_dir.mkdir(exist_ok=True)
        
        self.registry_path = self.base_dir / model_registry
        self.registry = self._load_registry()
        
    def _load_registry(self):
        """Load model registry from JSON"""
        if self.registry_path.exists():
            with open(self.registry_path, 'r') as f:
                return json.load(f)
        return {
            "current_version": "1.0.0",
            "deployed_at": None,
            "metrics": {},
            "history": []
        }
    
    def _save_registry(self):
        """Save model registry to JSON"""
        with open(self.registry_path, 'w') as f:
            json.dump(self.registry, f, indent=2)
    
    def save_model(self, model, model_name, version=None, metrics=None):
        """Save model with versioning"""
        if version is None:
            version = self._generate_version()
        
        model_path = self.current_models_dir / f"{model_name}_v{version}.pkl"
        joblib.dump(model, model_path)
        
        logger.info(f"Model saved: {model_name} v{version} at {model_path}")
        
        # Update registry
        self.registry["current_version"] = version
        self.registry["deployed_at"] = datetime.now().isoformat()
        if metrics:
            self.registry["metrics"][model_name] = metrics
        
        self.registry["history"].append({
            "version": version,
            "model_name": model_name,
            "timestamp": datetime.now().isoformat(),
            "metrics": metrics or {}
        })
        
        self._save_registry()
        return model_path, version
    
    def load_model(self, model_name):
        """Load latest model version"""
        models = list(self.current_models_dir.glob(f"{model_name}_v*.pkl"))
        if not models:
            raise FileNotFoundError(f"No models found for {model_name}")
        
        latest_model = max(models, key=lambda p: self._extract_version(p.name))
        logger.info(f"Loading model: {latest_model.name}")
        return joblib.load(latest_model)
    
    def archive_old_model(self, model_name):
        """Archive previous model version"""
        current_models = list(self.current_models_dir.glob(f"{model_name}_v*.pkl"))
        if len(current_models) > 1:
            old_model = min(current_models, key=lambda p: self._extract_version(p.name))
            dest = self.archived_models_dir / old_model.name
            shutil.move(str(old_model), str(dest))
            logger.info(f"Archived: {old_model.name}")
    
    def _generate_version(self):
        """Generate next semantic version"""
        current = self.registry.get("current_version", "1.0.0")
        parts = current.split('.')
        parts[2] = str(int(parts[2]) + 1)
        return '.'.join(parts)
    
    @staticmethod
    def _extract_version(filename):
        """Extract version number from filename"""
        try:
            return float(filename.split('v')[1].split('.pkl')[0])
        except:
            return 0.0
    
    def get_model_metrics(self):
        """Get current model metrics"""
        return self.registry.get("metrics", {})
    
    def get_deployment_info(self):
        """Get deployment information"""
        return {
            "current_version": self.registry.get("current_version"),
            "deployed_at": self.registry.get("deployed_at"),
            "metrics": self.registry.get("metrics"),
            "last_trained": self.registry["history"][-1]["timestamp"] if self.registry["history"] else None
        }
    
    def health_check(self):
        """Check if all models are available and healthy"""
        crime_types = [
            'murder', 'rape', 'kidnapping_abduction', 'theft', 'robbery',
            'burglary', 'dacoity', 'arson', 'criminal_intimidation',
            'outraging_modesty', 'rape_minor', 'sexual_harassment',
            'criminal_breach_trust', 'cheating', 'counterfeiting',
            'forgery', 'cybercrimes', 'drug_trafficking'
        ]
        
        status = {}
        for crime_type in crime_types:
            try:
                self.load_model(crime_type)
                status[crime_type] = "healthy"
            except Exception as e:
                status[crime_type] = f"error: {str(e)}"
                logger.error(f"Model {crime_type} health check failed: {e}")
        
        return status
