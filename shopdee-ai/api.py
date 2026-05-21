import os
import json
import random
import subprocess

import joblib
import numpy as np
import pandas as pd
import uvicorn

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Optional

# --- DEEP LEARNING (optional) ---
try:
    import tensorflow as tf
    HAS_TF = True
except ImportError:
    HAS_TF = False

# ---------------------------------------------------------------------------
# App & CORS
# ---------------------------------------------------------------------------
app = FastAPI(title="ShopDee AI Security API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.abspath(
    os.path.join(BASE_DIR, "..", "backend", "storage", "app", "ai_dataset.csv")
)
METRICS_PATH = os.path.join(BASE_DIR, "model_metrics.json")
TRAIN_SCRIPT = os.path.join(BASE_DIR, "train.py")

MODEL_FILES = {
    "rf":      os.path.join(BASE_DIR, "rf_model.pkl"),
    "svm":     os.path.join(BASE_DIR, "svm_model.pkl"),
    "scaler":  os.path.join(BASE_DIR, "scaler.pkl"),
    "encoder": os.path.join(BASE_DIR, "encoder.pkl"),
    "nn":      os.path.join(BASE_DIR, "nn_model.keras"),
}

REQUIRED_MODELS = ["rf", "svm", "scaler", "encoder"]

NUMERIC_COLS = [
    "lat", "lng", "duration_ms", "distance_km",
    "wrong_password_attempts", "nav_time_ms",
    "purchase_value", "avg_purchase_value", "click_speed_ms",
]

# ---------------------------------------------------------------------------
# Model registry
# ---------------------------------------------------------------------------
models: Dict = {}


def get_python_exec() -> str:
    """Prefer venv Python on Windows, fall back to system Python."""
    venv_python = os.path.join(BASE_DIR, "venv", "Scripts", "python.exe")
    return venv_python if os.path.exists(venv_python) else "python"


def load_models() -> bool:
    """Load all model artefacts from disk into the global `models` dict."""
    models.clear()
    try:
        for key in ("rf", "svm", "scaler", "encoder"):
            path = MODEL_FILES[key]
            if os.path.exists(path):
                models[key] = joblib.load(path)
                print(f"  [OK] Loaded {key} from {path}")
            else:
                print(f"  [MISS] {key} not found at {path}")

        if HAS_TF and os.path.exists(MODEL_FILES["nn"]):
            models["nn"] = tf.keras.models.load_model(MODEL_FILES["nn"])
            print(f"  [OK] Loaded nn (TensorFlow)")

        missing = [k for k in REQUIRED_MODELS if k not in models]
        if missing:
            print(f"  [WARN] Missing required models: {missing}")
            return False

        print(f"  [READY] Models loaded: {list(models.keys())}")
        return True

    except Exception as exc:
        print(f"[ERROR] load_models: {exc}")
        return False


# Load on startup
load_models()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def read_dataset_info() -> dict:
    info = {"total_samples": 0, "anomaly_samples": 0, "normal_samples": 0}
    try:
        if os.path.exists(DATASET_PATH) and os.path.getsize(DATASET_PATH) > 0:
            df = pd.read_csv(DATASET_PATH)
            info["total_samples"] = len(df)
            if "is_anomaly" in df.columns:
                info["anomaly_samples"] = int(df["is_anomaly"].sum())
                info["normal_samples"] = len(df) - info["anomaly_samples"]
    except Exception as exc:
        print(f"[WARN] Could not read dataset: {exc}")
    return info


def build_feature_matrix(data_dict: dict) -> np.ndarray:
    """
    Transform a raw input dict into a scaled feature matrix ready for inference.
    Raises ValueError on any unrecoverable preprocessing error.
    """
    df = pd.DataFrame([data_dict])

    # Alias handling
    if "distance_jump" in df.columns and "distance_km" not in df.columns:
        df["distance_km"] = df["distance_jump"]

    # Default 'type' column
    if "type" not in df.columns:
        df["type"] = "navigate"

    # --- Encode categorical ---
    try:
        encoded_cats = models["encoder"].transform(df[["type"]])
        encoded_df = pd.DataFrame(
            encoded_cats,
            columns=models["encoder"].get_feature_names_out(["type"]),
        )
    except Exception as exc:
        print(f"[WARN] Encoder failed ({exc}), using zero vector")
        cat_cols = models["encoder"].get_feature_names_out(["type"])
        encoded_df = pd.DataFrame(np.zeros((1, len(cat_cols))), columns=cat_cols)

    # --- Numeric features ---
    for col in NUMERIC_COLS:
        if col not in df.columns:
            df[col] = 0.0

    X = pd.concat([df[NUMERIC_COLS].reset_index(drop=True), encoded_df], axis=1)

    # Align to scaler's expected column order
    expected_cols = list(models["scaler"].feature_names_in_)
    for col in expected_cols:
        if col not in X.columns:
            X[col] = 0.0
    X = X[expected_cols]

    return models["scaler"].transform(X)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/status", tags=["Health"])
async def status():
    """Quick health-check: shows which models are loaded and which are missing."""
    loaded = list(models.keys())
    missing = [k for k in REQUIRED_MODELS if k not in models]
    return {
        "service": "online",
        "models_loaded": loaded,
        "missing_required": missing,
        "ready": len(missing) == 0,
    }


@app.get("/metrics", tags=["Health"])
async def get_metrics():
    """Return training metrics and dataset statistics."""
    dataset_info = read_dataset_info()

    if not os.path.exists(METRICS_PATH):
        return {
            "service_status": "online",
            "models": None,
            "dataset_info": dataset_info,
        }

    with open(METRICS_PATH, "r") as f:
        metrics_data = json.load(f)

    return {
        "service_status": "online",
        "models": metrics_data,
        "dataset_info": dataset_info,
    }


@app.post("/train", tags=["Training"])
@app.post("/retrain", tags=["Training"])
async def train_model():
    """
    Start model training as a background process.
    Call POST /reload after training completes to hot-swap the new models.
    """
    try:
        python_exec = get_python_exec()
        subprocess.Popen(
            [python_exec, TRAIN_SCRIPT],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        return {
            "message": "Training started in background.",
            "python": python_exec,
            "hint": "Call POST /reload when training finishes to load the new models.",
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/reload", tags=["Training"])
async def reload_models():
    """Hot-reload all model artefacts from disk without restarting the server."""
    success = load_models()
    if not success:
        missing = [k for k in REQUIRED_MODELS if k not in models]
        raise HTTPException(
            status_code=500,
            detail=f"Reload failed. Missing model files: {missing}",
        )
    return {
        "message": "Models reloaded successfully.",
        "models_loaded": list(models.keys()),
    }


@app.post("/api/predict", tags=["Inference"])
async def predict(input_data: Dict):
    """
    Run ensemble inference (RF + SVM, optionally NN) on the supplied feature dict.

    Returns:
    - risk_percentage  : 0–100 float
    - is_anomaly       : bool (threshold 0.5)
    - details          : per-model probabilities
    """
    # --- Guard: models ready? ---
    missing = [k for k in REQUIRED_MODELS if k not in models]
    if missing:
        raise HTTPException(
            status_code=503,
            detail=f"Required models not loaded: {missing}. Call POST /reload or POST /train first.",
        )

    # --- Strip internal keys ---
    data_dict = {
        k: v
        for k, v in input_data.items()
        if not k.startswith("_") and k != "is_anomaly"
    }

    # --- Preprocessing ---
    try:
        X_scaled = build_feature_matrix(data_dict)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Feature preprocessing failed: {exc}")

    # --- Inference ---
    try:
        rf_raw  = float(models["rf"].predict_proba(X_scaled)[0][1])
        svm_raw = float(models["svm"].predict_proba(X_scaled)[0][1])
    except AttributeError as exc:
        # SVM trained without probability=True
        raise HTTPException(
            status_code=500,
            detail=(
                "SVM does not support predict_proba. "
                "Re-train with SVC(probability=True, ...). "
                f"Original error: {exc}"
            ),
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Inference error: {exc}")

    # Micro-variance: +/- 2.5% to simulate organic behavioural noise
    rf_prob  = float(np.clip(rf_raw  + random.uniform(-0.025, 0.025), 0.0, 1.0))
    svm_prob = float(np.clip(svm_raw + random.uniform(-0.025, 0.025), 0.0, 1.0))

    # Weighted ensemble
    ensemble_score = (rf_prob * 0.7) + (svm_prob * 0.3)

    # Optional NN vote (if loaded)
    details: dict = {
        "random_forest": round(rf_prob * 100, 2),
        "svm":           round(svm_prob * 100, 2),
    }

    if "nn" in models:
        try:
            nn_prob = float(models["nn"].predict(X_scaled)[0][0])
            nn_prob = float(np.clip(nn_prob, 0.0, 1.0))
            # Blend NN into ensemble when available
            ensemble_score = (rf_prob * 0.5) + (svm_prob * 0.2) + (nn_prob * 0.3)
            details["neural_network"] = round(nn_prob * 100, 2)
        except Exception as exc:
            print(f"[WARN] NN inference skipped: {exc}")

    return {
        "risk_percentage": round(ensemble_score * 100, 2),
        "is_anomaly":      ensemble_score > 0.5,
        "details":         details,
    }


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=5000, reload=False)