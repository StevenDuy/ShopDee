import os
import joblib
import pandas as pd
import numpy as np
import subprocess
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
from fastapi.middleware.cors import CORSMiddleware

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
        scaler_path = os.path.join(base_dir, 'scaler.pkl')
        encoder_path = os.path.join(base_dir, 'encoder.pkl')
        
        if all(os.path.exists(p) for p in [rf_path, svm_path, scaler_path, encoder_path]):
            models['rf'] = joblib.load(rf_path)
            models['svm'] = joblib.load(svm_path)
            models['scaler'] = joblib.load(scaler_path)
            models['encoder'] = joblib.load(encoder_path)
            print("Models loaded successfully.")
            return True
        return False
    except Exception as e:
        print(f"Error loading models: {e}")
        return False

load_models()

class ActionInput(BaseModel):
    user_id: int
    type: str
    lat: float
    lng: float
    duration_ms: Optional[float] = 0
    distance_jump: Optional[float] = 0
    wrong_password_attempts: Optional[int] = 0
    address_changes: Optional[int] = 0
    click_speed_ms: Optional[int] = 0
    purchase_quantity: Optional[int] = 0
    purchase_value: Optional[float] = 0
    click_count: Optional[int] = 0

@app.get("/metrics")
async def get_metrics():
    metrics_path = os.path.join(base_dir, 'model_metrics.json')
    trained = 'rf' in models
    
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
        import json
        metrics_data = json.load(f)
        return {
            "service_status": "online", 
            "models": metrics_data,
            "dataset_info": dataset_info
        }

@app.post("/train")
async def train_model():
    try:
        # Check if dataset exists
        if not os.path.exists(dataset_path) or os.path.getsize(dataset_path) == 0:
             # Basic heuristic seed if empty
             seed_initial_data()
        
        process = subprocess.Popen(['python', os.path.join(base_dir, 'train.py')], 
                                    stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        stdout, stderr = process.communicate()
        
        if process.returncode == 0:
            load_models()
            return {"message": "Training successful", "output": stdout.decode()}
        else:
            return {"message": "Training failed", "error": stderr.decode()}, 500
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/retrain")
async def retrain_model():
    return await train_model()

@app.post("/api/predict")
async def predict(input_data: ActionInput):
    # Prepare input
    data_dict = input_data.model_dump()
    
    # Save to dataset for later learning
    is_anomaly = check_heuristic_anomaly(data_dict)
    save_to_dataset(input_data, is_anomaly)

    if 'rf' not in models:
        return {
            "error": "Models not trained",
            "heuristic_risk": is_anomaly * 100,
            "random_forest": {"risk_percentage": is_anomaly * 100, "prediction": "fraud" if is_anomaly else "normal"},
            "svm": {"risk_percentage": is_anomaly * 100, "prediction": "fraud" if is_anomaly else "normal"}
        }

    # Preprocessing
    df_input = pd.DataFrame([data_dict])
    
    # Encode 'type'
    encoded_cats = models['encoder'].transform(df_input[['type']])
    encoded_df = pd.DataFrame(encoded_cats, columns=models['encoder'].get_feature_names_out(['type']))
    
    # Numeric features
    numeric_cols = [
        'lat', 'lng', 'duration_ms', 'distance_jump', 
        'wrong_password_attempts', 'address_changes', 
        'click_speed_ms', 'purchase_quantity', 'purchase_value', 'click_count'
    ]
    
    X = pd.concat([df_input[numeric_cols], encoded_df], axis=1)
    
    # Ensure all features exist
    expected_cols = list(models['scaler'].feature_names_in_)
    for col in expected_cols:
        if col not in X.columns:
            X[col] = 0.0
    X = X[expected_cols]
    
    X_scaled = models['scaler'].transform(X)

    # Predictions
    rf_prob = models['rf'].predict_proba(X_scaled)[0][1]
    svm_prob = models['svm'].predict_proba(X_scaled)[0][1]

    return {
        "random_forest": {
            "risk_percentage": float(rf_prob * 100),
            "prediction": "fraud" if rf_prob > 0.5 else "normal"
        },
        "svm": {
            "risk_percentage": float(svm_prob * 100),
            "prediction": "fraud" if svm_prob > 0.5 else "normal"
        }
    }

def check_heuristic_anomaly(data: dict) -> int:
    if data['wrong_password_attempts'] >= 5: return 1
    if 0 < data['click_speed_ms'] < 100 and data['click_count'] > 15: return 1
    if data['distance_jump'] > 10000: return 1
    if data['purchase_quantity'] > 20: return 1
    return 0

def save_to_dataset(input_data: ActionInput, is_anomaly: int):
    data_dict = input_data.model_dump()
    data_dict['is_anomaly'] = is_anomaly
    df = pd.DataFrame([data_dict])
    header = not os.path.exists(dataset_path) or os.path.getsize(dataset_path) == 0
    df.to_csv(dataset_path, mode='a', index=False, header=header)

def seed_initial_data():
    # Simple seed to allow initial training
    data = []
    # Normal patterns
    for _ in range(20):
        data.append({
            'user_id': 1, 'type': 'view_product', 'lat': 10.7, 'lng': 106.6, 
            'duration_ms': 5000, 'distance_jump': 0, 'wrong_password_attempts': 0,
            'address_changes': 0, 'click_speed_ms': 500, 'purchase_quantity': 1,
            'purchase_value': 100, 'click_count': 5, 'is_anomaly': 0
        })
    # Fraud patterns
    for _ in range(5):
        data.append({
            'user_id': 2, 'type': 'login', 'lat': 20.0, 'lng': 120.0, 
            'duration_ms': 100, 'distance_jump': 50000, 'wrong_password_attempts': 10,
            'address_changes': 5, 'click_speed_ms': 20, 'purchase_quantity': 100,
            'purchase_value': 9999, 'click_count': 50, 'is_anomaly': 1
        })
    df = pd.DataFrame(data)
    df.to_csv(dataset_path, index=False)

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=5000)