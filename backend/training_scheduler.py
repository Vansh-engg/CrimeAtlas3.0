"""
Automated Model Training Scheduler
Runs model retraining at fixed intervals and deploys automatically
"""

import os
import sys
import logging
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBRegressor
import joblib

from model_manager import ModelManager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ModelTrainingScheduler:
    def __init__(self, data_path, models_dir="models"):
        """Initialize the training scheduler"""
        self.data_path = data_path
        self.model_manager = ModelManager(base_dir=models_dir)
        self.scheduler = BackgroundScheduler()
        self.df = None
        self.crime_types = [
            'murder', 'rape', 'kidnapping_abduction', 'theft', 'robbery',
            'burglary', 'dacoity', 'arson', 'criminal_intimidation',
            'outraging_modesty', 'rape_minor', 'sexual_harassment',
            'criminal_breach_trust', 'cheating', 'counterfeiting',
            'forgery', 'cybercrimes', 'drug_trafficking'
        ]
        self._load_data()
    
    def _load_data(self):
        """Load dataset"""
        try:
            self.df = pd.read_csv(self.data_path)
            logger.info(f"Dataset loaded: {len(self.df)} rows")
        except Exception as e:
            logger.error(f"Failed to load dataset: {e}")
            raise
    
    def train_models(self):
        """Train all crime prediction models"""
        logger.info("=== Starting automated model training ===")
        start_time = datetime.now()
        
        try:
            metrics = {}
            
            for crime_type in self.crime_types:
                logger.info(f"Training model for: {crime_type}")
                
                try:
                    # Prepare data
                    crime_df = self.df[self.df['crime_type'] == crime_type].copy()
                    
                    if len(crime_df) < 10:
                        logger.warning(f"Insufficient data for {crime_type}")
                        metrics[crime_type] = {"status": "skipped", "reason": "insufficient_data"}
                        continue
                    
                    # Features and target
                    X = crime_df[['city', 'year', 'month']].copy()
                    y = crime_df['crime_counts']
                    
                    # Encode city
                    le = LabelEncoder()
                    X['city_encoded'] = le.fit_transform(X['city'])
                    X = X[['city_encoded', 'year', 'month']]
                    
                    # Train model
                    model = XGBRegressor(
                        n_estimators=100,
                        max_depth=6,
                        learning_rate=0.1,
                        subsample=0.8,
                        random_state=42
                    )
                    model.fit(X, y)
                    
                    # Calculate metrics
                    train_score = model.score(X, y)
                    
                    # Save model
                    model_path, version = self.model_manager.save_model(
                        model, 
                        crime_type,
                        metrics={
                            "r2_score": float(train_score),
                            "samples": len(crime_df),
                            "trained_at": datetime.now().isoformat()
                        }
                    )
                    
                    # Archive old version
                    self.model_manager.archive_old_model(crime_type)
                    
                    metrics[crime_type] = {
                        "status": "success",
                        "r2_score": train_score,
                        "version": version
                    }
                    
                    logger.info(f"✓ {crime_type}: R² = {train_score:.4f}")
                    
                except Exception as e:
                    logger.error(f"Failed to train {crime_type}: {e}")
                    metrics[crime_type] = {"status": "failed", "error": str(e)}
            
            # Log summary
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            
            successful = sum(1 for m in metrics.values() if m.get("status") == "success")
            logger.info(f"=== Training complete ===")
            logger.info(f"Successful: {successful}/{len(self.crime_types)}")
            logger.info(f"Duration: {duration:.2f}s")
            
            # Health check
            health = self.model_manager.health_check()
            healthy = sum(1 for h in health.values() if h == "healthy")
            logger.info(f"Model health: {healthy}/{len(health)} models ready")
            
            return {"status": "success", "metrics": metrics, "duration": duration}
            
        except Exception as e:
            logger.error(f"Training scheduler failed: {e}")
            return {"status": "failed", "error": str(e)}
    
    def schedule_training(self, schedule_type="daily", hour=2, minute=0):
        """Schedule automatic model training
        
        Args:
            schedule_type: 'daily', 'weekly', 'monthly'
            hour: Hour to run (0-23)
            minute: Minute to run (0-59)
        """
        job_name = f"model_training_{schedule_type}"
        
        try:
            if schedule_type == "daily":
                trigger = CronTrigger(hour=hour, minute=minute)
            elif schedule_type == "weekly":
                trigger = CronTrigger(day_of_week='sun', hour=hour, minute=minute)
            elif schedule_type == "monthly":
                trigger = CronTrigger(day=1, hour=hour, minute=minute)
            else:
                raise ValueError(f"Unknown schedule type: {schedule_type}")
            
            self.scheduler.add_job(
                self.train_models,
                trigger=trigger,
                id=job_name,
                name=job_name,
                replace_existing=True
            )
            
            logger.info(f"Scheduled {schedule_type} training at {hour:02d}:{minute:02d}")
            
        except Exception as e:
            logger.error(f"Failed to schedule training: {e}")
    
    def start(self):
        """Start the scheduler"""
        try:
            self.scheduler.start()
            logger.info("Model training scheduler started")
        except Exception as e:
            logger.error(f"Failed to start scheduler: {e}")
    
    def stop(self):
        """Stop the scheduler"""
        try:
            self.scheduler.shutdown()
            logger.info("Model training scheduler stopped")
        except Exception as e:
            logger.error(f"Failed to stop scheduler: {e}")
    
    def get_status(self):
        """Get scheduler status"""
        return {
            "running": self.scheduler.running,
            "jobs": [
                {
                    "id": job.id,
                    "name": job.name,
                    "next_run_time": str(job.next_run_time)
                }
                for job in self.scheduler.get_jobs()
            ],
            "deployment_info": self.model_manager.get_deployment_info()
        }
