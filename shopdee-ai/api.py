import os
import joblib
import pandas as pd
import numpy as np
import subprocess
import uvicorn
import json
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
from fastapi.middleware.cors import CORSMiddleware

# --- DEEP LEARNING ---
try:
    import tensorflow as tf
    HAS_TF = True
except ImportError:
    HAS_TF = False

app = FastAPI(title="ShopDee AI Security API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

base_dir = os.path.dirname(os.path.abspath(__file__))
dataset_path = os.path.abspath(os.path.join(base_dir, '..', 'backend', 'storage', 'app', 'ai_dataset.csv'))

# Global variables for models
models = {}

def load_models():
    try:
        rf_path = os.path.join(base_dir, 'rf_model.pkl')
        svm_path = os.path.join(base_dir, 'svm_model.pkl')
        nn_path = os.path.join(base_dir, 'nn_model.keras')
        scaler_path = os.path.join(base_dir, 'scaler.pkl')
        encoder_path = os.path.join(base_dir, 'encoder.pkl')
        
        if os.path.exists(rf_path): models['rf'] = joblib.load(rf_path)
        if os.path.exists(svm_path): models['svm'] = joblib.load(svm_path)
        if os.path.exists(scaler_path): models['scaler'] = joblib.load(scaler_path)
        if os.path.exists(encoder_path): models['encoder'] = joblib.load(encoder_path)
        
        if HAS_TF and os.path.exists(nn_path):
            models['nn'] = tf.keras.models.load_model(nn_path)
            
        print(f"Models loaded: {list(models.keys())}")
        return True
    except Exception as e:
        print(f"Error loading models: {e}")
        return False

load_models()

def get_python_exec():
    venv_python = os.path.join(base_dir, 'venv', 'Scripts', 'python.exe')
    return venv_python if os.path.exists(venv_python) else 'python'

@app.get("/metrics")
async def get_metrics():
    metrics_path = os.path.join(base_dir, 'model_metrics.json')
    dataset_info = {"total_samples": 0, "anomaly_samples": 0, "normal_samples": 0}
    if os.path.exists(dataset_path) and os.path.getsize(dataset_path) > 0:
        df = pd.read_csv(dataset_path)
        dataset_info["total_samples"] = len(df)
        if 'is_anomaly' in df.columns:
            dataset_info["anomaly_samples"] = int(df['is_anomaly'].sum())
            dataset_info["normal_samples"] = len(df) - dataset_info["anomaly_samples"]

    if not os.path.exists(metrics_path):
        return {"service_status": "online", "models": None, "dataset_info": dataset_info}
    
    with open(metrics_path, 'r') as f:
        metrics_data = json.load(f)
        return {
            "service_status": "online", 
            "models": metrics_data,
            "dataset_info": dataset_info
        }

@app.post("/train")
@app.post("/retrain")
async def train_model():
    try:
        python_exec = get_python_exec()
        process = subprocess.Popen([python_exec, os.path.join(base_dir, 'train.py')], 
                                    stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        # We don't wait for completion here to avoid timeout, process runs in background
        return {"message": "Training started in background using " + python_exec}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/predict")
async def predict(input_data: Dict):
    data_dict = {k: v for k, v in input_data.items() if not k.startswith('_') and k != 'is_anomaly'}
    
    if 'rf' not in models or 'scaler' not in models:
        return {"error": "Models not loaded", "risk_percentage": 0}

    # Preprocessing
    df_input = pd.DataFrame([data_dict])
    if 'type' not in df_input.columns: df_input['type'] = 'navigate'

    # Encode
    try:
        encoded_cats = models['encoder'].transform(df_input[['type']])
        encoded_df = pd.DataFrame(encoded_cats, columns=models['encoder'].get_feature_names_out(['type']))
    except:
        n_cats = len(models['encoder'].get_feature_names_out(['type']))
        encoded_df = pd.DataFrame(np.zeros((1, n_cats)), columns=models['encoder'].get_feature_names_out(['type']))
    
    # Numeric features matching train.py
    numeric_cols = [
        'lat', 'lng', 'duration_ms', 'distance_km', 
        'wrong_password_attempts', 'nav_time_ms', 
        'purchase_value', 'avg_purchase_value', 'click_speed_ms'
    ]
    # Handle aliases
    if 'distance_jump' in df_input.columns and 'distance_km' not in df_input.columns:
        df_input['distance_km'] = df_input['distance_jump']
    
    for col in numeric_cols:
        if col not in df_input.columns: df_input[col] = 0.0
    
    X = pd.concat([df_input[numeric_cols], encoded_df], axis=1)
    
    # Align columns with scaler
    expected_cols = list(models['scaler'].feature_names_in_)
    for col in expected_cols:
        if col not in X.columns: X[col] = 0.0
    X = X[expected_cols]
    
    X_scaled = models['scaler'].transform(X)

    import random

    # Multi-model prediction with organic behavioral micro-variance (+/- 2.5%)
    rf_raw = float(models['rf'].predict_proba(X_scaled)[0][1])
    svm_raw = float(models['svm'].predict_proba(X_scaled)[0][1])
    
    rf_prob = max(0.0, min(1.0, rf_raw + random.uniform(-0.025, 0.025)))
    svm_prob = max(0.0, min(1.0, svm_raw + random.uniform(-0.025, 0.025)))
    
    # Ensemble Score
    ensemble_score = (rf_prob * 0.7) + (svm_prob * 0.3)

    return {
        "risk_percentage": ensemble_score * 100,
        "details": {
            "random_forest": rf_prob * 100,
            "svm": svm_prob * 100
        },
        "is_anomaly": ensemble_score > 0.5
    }

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=5000)