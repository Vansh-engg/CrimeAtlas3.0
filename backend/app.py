from flask import Flask, request, jsonify
import pandas as pd
import numpy as np
import joblib
import os
from flask_cors import CORS
import logging
from datetime import datetime

# CI/CD MLOps imports
from model_manager import ModelManager
from cicd_endpoints import setup_cicd_endpoints

app = Flask(__name__)
CORS(app)

# --------------------------------------------------
# Setup Logging
# --------------------------------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --------------------------------------------------
# Base Directory
# --------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# --------------------------------------------------
# Load Dataset
# --------------------------------------------------
# Corrected path to parent directory's Data folder
data_path = os.path.join(BASE_DIR, "Data", "india_city_crime_dataset_2015_2024_synthetic.csv")

if not os.path.exists(data_path):
    raise FileNotFoundError(f"Dataset not found at {data_path}")

df = pd.read_csv(data_path)

required_columns = ['city', 'crime_type', 'year', 'month', 'crime_counts']
for col in required_columns:
    if col not in df.columns:
        raise ValueError(f"Missing required column: {col}")

# --------------------------------------------------
# Load Encoder
# --------------------------------------------------
encoder_path = os.path.join(BASE_DIR, "encoders", "city_encoder.pkl")

if not os.path.exists(encoder_path):
    raise FileNotFoundError("city_encoder.pkl not found")

city_encoder = joblib.load(encoder_path)

# --------------------------------------------------
# Load Crime Models
# --------------------------------------------------
crime_types = [
    'murder',
    'rape',
    'kidnapping_abduction',
    'theft',
    'robbery',
    'dacoity',
    'grievous_hurt',
    'cyber_crime'
]

models = {}

for crime in crime_types:
    model_path = os.path.join(BASE_DIR, "models", f"{crime}_model.pkl")
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"{crime}_model.pkl not found")
    models[crime] = joblib.load(model_path)

# --------------------------------------------------
# Feature Order (MUST match training)
# --------------------------------------------------
features = [
    'year',
    'city_encoded',
    'month_sin',
    'month_cos',
    'lag_1',
    'lag_2',
    'lag_3',
    'lag_6',
    'lag_12',
    'rolling_mean_3',
    'rolling_mean_6'
]

# --------------------------------------------------
# Recursive Forecast Function
# --------------------------------------------------
def recursive_forecast(city, crime, target_year, target_month):
    model = models[crime]
    try:
        city_encoded = city_encoder.transform([city])[0]
    except Exception:
        # Fallback for unseen cities
        city_encoded = 0

    crime_df = df[(df['city'] == city) & (df['crime_type'].str.lower() == crime.lower())].copy()

    if crime_df.empty:
        # If city/crime data is missing, we use global average for that crime as base
        crime_df = df[df['crime_type'].str.lower() == crime.lower()].groupby(['year', 'month']).crime_counts.mean().reset_index()

    crime_df = crime_df.sort_values(['year', 'month']).reset_index(drop=True)

    if len(crime_df) < 12:
        # Pad with global averages if local history is too short for lags
        global_avg = df[df['crime_type'].str.lower() == crime.lower()].groupby(['year', 'month']).crime_counts.mean().reset_index()
        crime_df = pd.concat([global_avg.head(12), crime_df], ignore_index=True).sort_values(['year', 'month']).tail(24)

    last_year = int(crime_df.iloc[-1]['year'])
    last_month = int(crime_df.iloc[-1]['month'])

    curr_df = crime_df.copy()
    prediction = 0

    # Ensure we don't loop forever if target is in past
    if (target_year < last_year) or (target_year == last_year and target_month <= last_month):
        match = curr_df[(curr_df['year'] == target_year) & (curr_df['month'] == target_month)]
        if not match.empty:
            return int(match.iloc[0]['crime_counts'])
        return int(curr_df.iloc[-1]['crime_counts'])

    while (last_year < target_year) or (last_year == target_year and last_month < target_month):
        if last_month == 12:
            next_month = 1
            next_year = last_year + 1
        else:
            next_month = last_month + 1
            next_year = last_year

        lag_1 = curr_df.iloc[-1]['crime_counts']
        lag_2 = curr_df.iloc[-2]['crime_counts']
        lag_3 = curr_df.iloc[-3]['crime_counts']
        lag_6 = curr_df.iloc[-6]['crime_counts']
        lag_12 = curr_df.iloc[-12]['crime_counts']

        rolling_mean_3 = curr_df['crime_counts'].tail(3).mean()
        rolling_mean_6 = curr_df['crime_counts'].tail(6).mean()

        month_sin = np.sin(2 * np.pi * next_month / 12)
        month_cos = np.cos(2 * np.pi * next_month / 12)

        X_new = pd.DataFrame([[
            next_year,
            city_encoded,
            month_sin,
            month_cos,
            lag_1,
            lag_2,
            lag_3,
            lag_6,
            lag_12,
            rolling_mean_3,
            rolling_mean_6
        ]], columns=features)

        prediction = model.predict(X_new)[0]

        new_row = {
            'year': next_year,
            'month': next_month,
            'crime_counts': prediction
        }

        curr_df = pd.concat([curr_df, pd.DataFrame([new_row])], ignore_index=True)

        last_year = next_year
        last_month = next_month

    return int(round(float(prediction), 0))

# --------------------------------------------------
# Prediction API
# --------------------------------------------------
@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json

        city = data.get("city")
        year = int(data.get("year", 2025))
        month = int(data.get("month", 1))
        crime = data.get("crime", "all")

        if city not in df['city'].unique():
            return jsonify({"error": f"Invalid city: {city}"}), 400

        if month < 1 or month > 12:
            return jsonify({"error": "Invalid month"}), 400

        if crime != "all" and crime not in crime_types:
            return jsonify({"error": f"Invalid crime type: {crime}"}), 400

        if crime == "all":
            results = {}
            for crime_type in crime_types:
                pred = recursive_forecast(city, crime_type, year, month)
                results[crime_type.replace('_', ' ').title()] = pred

            return jsonify({
                "city": city,
                "year": year,
                "month": month,
                "predictions": results
            })
        else:
            pred = recursive_forecast(city, crime, year, month)
            return jsonify({
                "city": city,
                "year": year,
                "month": month,
                "crime": crime.replace('_', ' ').title(),
                "prediction": pred
            })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# --------------------------------------------------
# Utils
# --------------------------------------------------
@app.route("/", methods=["GET"])
def home():
    return jsonify({"status": "active", "engine": "ML-Recursive-Forecaster"})

@app.route("/cities", methods=["GET"])
def get_cities():
    cities = sorted(df['city'].unique().tolist())
    return jsonify(cities)

# --------------------------------------------------
# MLOps CI/CD Setup
# --------------------------------------------------
try:
    # Initialize Model Manager for version control
    model_manager = ModelManager(base_dir=os.path.join(BASE_DIR, "mlops_models"))
    logger.info("✓ Model Manager initialized")
    
    # Setup CI/CD monitoring endpoints
    setup_cicd_endpoints(app, model_manager)
    logger.info("✓ CI/CD endpoints registered")
    
    # Optional: Start background training scheduler
    # Uncomment to enable automatic daily model retraining at 2 AM
    # try:
    #     from training_scheduler import ModelTrainingScheduler
    #     scheduler = ModelTrainingScheduler(data_path, models_dir=os.path.join(BASE_DIR, "mlops_models"))
    #     scheduler.schedule_training(schedule_type="daily", hour=2, minute=0)
    #     scheduler.start()
    #     logger.info("✓ Model training scheduler started - Daily at 2:00 AM UTC")
    # except Exception as e:
    #     logger.warning(f"Training scheduler not started (non-critical): {e}")
    
except Exception as e:
    logger.error(f"MLOps setup warning (non-critical): {e}")
    model_manager = None

# --------------------------------------------------
# Run Server
# --------------------------------------------------
if __name__ == "__main__":
    logger.info("\n" + "="*50)
    logger.info("CrimeAtlas API Server Starting")
    logger.info("="*50)
    logger.info(f"Base Directory: {BASE_DIR}")
    logger.info(f"Data Path: {data_path}")
    logger.info(f"Loaded {len(crime_types)} crime models")
    logger.info(f"Available cities: {len(df['city'].unique())}")
    if model_manager:
        logger.info("✓ MLOps pipeline ready")
        logger.info("  - Health check: GET /health")
        logger.info("  - Model status: GET /api/models/status")
        logger.info("  - Model history: GET /api/models/history")
    logger.info("="*50)
    logger.info("Server running on http://0.0.0.0:5000")
    logger.info("="*50 + "\n")
    
    app.run(port=5000, debug=True)
