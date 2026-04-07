from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import joblib
import json
import time
from typing import Dict
import os
import subprocess

app = FastAPI(title="ShopDee AI Fraud Detection", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

base_dir = os.path.dirname(os.path.abspath(__file__))
dataset_path = os.path.abspath(os.path.join(base_dir, '..', 'backend', 'storage', 'app', 'ai_dataset.csv'))
model_metrics_path = os.path.join(base_dir, 'model_metrics.json')
rf_model_path = os.path.join(base_dir, 'rf_model.pkl')
svm_model_path = os.path.join(base_dir, 'svm_model.pkl')
scaler_path = os.path.join(base_dir, 'scaler.pkl')
encoder_path = os.path.join(base_dir, 'encoder.pkl')

rf_model = None
svm_model = None
scaler = None
encoder = None


def load_models():
    global rf_model, svm_model, scaler, encoder

    if os.path.exists(rf_model_path) and os.path.exists(svm_model_path) and os.path.exists(scaler_path) and os.path.exists(encoder_path):
        rf_model = joblib.load(rf_model_path)
        svm_model = joblib.load(svm_model_path)
        scaler = joblib.load(scaler_path)
        encoder = joblib.load(encoder_path)


load_models()


class BehaviorData(BaseModel):
    user_id: int
    type: str
    lat: float
    lng: float
    duration_ms: float = 0.0
    distance_jump: float = 0.0
    wrong_password_attempts: float = 0.0
    address_changes: float = 0.0
    click_speed_ms: float = 0.0
    purchase_quantity: float = 0.0
    purchase_value: float = 0.0
    click_count: float = 0.0


def load_saved_metrics() -> Dict:
    if os.path.exists(model_metrics_path):
        with open(model_metrics_path, 'r') as f:
            return json.load(f)

    return {
        'random_forest_accuracy': None,
        'svm_accuracy': None,
        'feature_names': [],
        'training_samples': 0,
    }


def models_available() -> bool:
    return rf_model is not None and svm_model is not None and scaler is not None and encoder is not None


@app.get('/metrics')
async def get_metrics() -> Dict:
    if os.path.exists(dataset_path):
        df = pd.read_csv(dataset_path)
        total_samples = len(df)
        anomaly_count = int(df['is_anomaly'].sum()) if 'is_anomaly' in df.columns else 0
        normal_count = total_samples - anomaly_count
    else:
        total_samples = anomaly_count = normal_count = 0

    saved_metrics = load_saved_metrics()
    trained = models_available()

    return {
        'dataset_info': {
            'total_samples': total_samples,
            'anomaly_samples': anomaly_count,
            'normal_samples': normal_count,
        },
        'models': {
            'random_forest': {
                'accuracy': saved_metrics.get('random_forest_accuracy'),
                'features': saved_metrics.get('feature_names', []),
                'trained': trained,
            },
            'svm': {
                'accuracy': saved_metrics.get('svm_accuracy'),
                'features': saved_metrics.get('feature_names', []),
                'trained': trained,
            },
        },
    }

@app.post('/retrain')
async def retrain_models(background_tasks: BackgroundTasks) -> Dict:
    background_tasks.add_task(run_retrain)
    return {'message': 'Model training started in background. Refresh metrics after a moment.'}


def run_retrain():
    subprocess.run(['php', 'artisan', 'ai:export-data'], cwd=os.path.abspath(os.path.join(base_dir, '..', 'backend')))
    subprocess.run(['python', 'train.py'], cwd=base_dir)
    load_models()

@app.post('/api/predict')
async def predict_fraud(data: BehaviorData) -> Dict:
    if not models_available():
        raise HTTPException(status_code=503, detail='AI models are not trained yet. Run training first.')

    start_time = time.time()

    # Prepare input data
    input_data = {
        'lat': [data.lat],
        'lng': [data.lng],
        'duration_ms': [data.duration_ms],
        'distance_jump': [data.distance_jump],
        'wrong_password_attempts': [data.wrong_password_attempts],
        'address_changes': [data.address_changes],
        'click_speed_ms': [data.click_speed_ms],
        'purchase_quantity': [data.purchase_quantity],
        'purchase_value': [data.purchase_value],
        'click_count': [data.click_count],
        'type': [data.type],
    }
    df_input = pd.DataFrame(input_data)

    # One-Hot Encode categorical
    encoded_cats = encoder.transform(df_input[['type']])
    encoded_df = pd.DataFrame(encoded_cats, columns=encoder.get_feature_names_out(['type']))

    # Combine
    X_input = pd.concat([
        df_input[['lat', 'lng', 'duration_ms', 'distance_jump', 'wrong_password_attempts', 'address_changes', 'click_speed_ms', 'purchase_quantity', 'purchase_value', 'click_count']],
        encoded_df,
    ], axis=1)

    # Ensure columns match training (fill missing with 0)
    expected_cols = list(scaler.feature_names_in_)
    for col in expected_cols:
        if col not in X_input.columns:
            X_input[col] = 0.0
    X_input = X_input[expected_cols]

    # Scale
    X_scaled = scaler.transform(X_input)

    # Predictions
    rf_proba = rf_model.predict_proba(X_scaled)[0][1]  # Probability of anomaly (class 1)
    svm_proba = svm_model.predict_proba(X_scaled)[0][1]

    execution_time = time.time() - start_time

    return {
        "random_forest": {
            "risk_percentage": round(rf_proba * 100, 2),
            "execution_time_ms": round(execution_time * 1000, 2)
        },
        "svm": {
            "risk_percentage": round(svm_proba * 100, 2),
            "execution_time_ms": round(execution_time * 1000, 2)
        }
    }