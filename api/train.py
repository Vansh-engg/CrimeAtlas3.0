import pandas as pd
import numpy as np
import os
import joblib
from sklearn.preprocessing import LabelEncoder
import xgboost as xgb

# Base Directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, '..', 'Data', 'india_city_crime_dataset_2015_2024_synthetic.csv')
MODELS_DIR = os.path.join(BASE_DIR, 'models')
ENCODERS_DIR = os.path.join(BASE_DIR, 'encoders')

# Create directories if they don't exist
os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(ENCODERS_DIR, exist_ok=True)

def prepare_features(df):
    """Generates time-series features as expected by the prediction engine."""
    df = df.sort_values(['city', 'crime_type', 'year', 'month']).reset_index(drop=True)
    
    # Label Encoding for City
    le = LabelEncoder()
    df['city_encoded'] = le.fit_transform(df['city'])
    joblib.dump(le, os.path.join(ENCODERS_DIR, 'city_encoder.pkl'))
    
    # Cyclic Month Encoding
    df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
    df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)
    
    # Create Lag Features per (city, crime_type) group
    def create_lags(group):
        group['lag_1'] = group['crime_counts'].shift(1)
        group['lag_2'] = group['crime_counts'].shift(2)
        group['lag_3'] = group['crime_counts'].shift(3)
        group['lag_6'] = group['crime_counts'].shift(6)
        group['lag_12'] = group['crime_counts'].shift(12)
        group['rolling_mean_3'] = group['crime_counts'].rolling(window=3).mean()
        group['rolling_mean_6'] = group['crime_counts'].rolling(window=6).mean()
        return group

    df = df.groupby(['city', 'crime_type'], group_keys=False).apply(create_lags)
    
    # Drop rows with NaNs (first 12 months)
    return df.dropna()

def train_models():
    print("Loading dataset...")
    df = pd.read_csv(DATA_PATH)
    
    print("Preparing features...")
    df_prepared = prepare_features(df)
    
    crime_types = [
        'murder', 'rape', 'kidnapping_abduction', 'theft', 
        'robbery', 'dacoity', 'grievous_hurt', 'cyber_crime'
    ]
    
    feature_cols = [
        'year', 'city_encoded', 'month_sin', 'month_cos', 
        'lag_1', 'lag_2', 'lag_3', 'lag_6', 'lag_12', 
        'rolling_mean_3', 'rolling_mean_6'
    ]
    
    for crime in crime_types:
        print(f"Training XGBoost model for: {crime}...")
        crime_df = df_prepared[df_prepared['crime_type'].str.lower() == crime.lower()]
        
        if crime_df.empty:
            print(f"Warning: No data found for {crime}. Skipping.")
            continue
            
        X = crime_df[feature_cols]
        y = crime_df['crime_counts']
        
        # XGBoost Regressor with optimized parameters for time-series forecasting
        model = xgb.XGBRegressor(
            n_estimators=300, 
            learning_rate=0.05, 
            max_depth=6, 
            objective='reg:squarederror',
            random_state=42,
            n_jobs=-1
        )
        
        model.fit(X, y)
        
        model_path = os.path.join(MODELS_DIR, f"{crime}_model.pkl")
        joblib.dump(model, model_path)
        print(f"Saved: {model_path}")

if __name__ == "__main__":
    train_models()
    print("\n--- XGBoost Training Complete ---")
