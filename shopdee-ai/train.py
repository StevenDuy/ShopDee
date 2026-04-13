import json
import os
import joblib
import pandas as pd
import numpy as np
import time
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.svm import SVC

# --- DEEP LEARNING ---
try:
    import tensorflow as tf
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import Dense, Dropout
    from tensorflow.keras.callbacks import EarlyStopping
    HAS_TF = True
except ImportError:
    HAS_TF = False
    print("TensorFlow not found in current environment. Neural Network will be skipped.")

base_dir = os.path.dirname(os.path.abspath(__file__))
dataset_path = os.path.abspath(os.path.join(base_dir, '..', 'backend', 'storage', 'app', 'ai_dataset.csv'))

def log_progress(message):
    with open(os.path.join(base_dir, 'training_status.txt'), 'w', encoding='utf-8') as f:
        f.write(message)
    print(message)

if not os.path.exists(dataset_path):
    log_progress("Error: ai_dataset.csv not found.")
    exit(1)

log_progress("Loading 50,000 samples for research training...")
df = pd.read_csv(dataset_path)

numeric_cols = [
    'lat', 'lng', 'duration_ms', 'distance_km', 
    'wrong_password_attempts', 'nav_time_ms', 
    'purchase_value', 'avg_purchase_value', 'click_speed_ms'
]

# Preprocessing
for col in numeric_cols:
    df[col] = df[col].fillna(0)

categorical_cols = ['type']
encoder = OneHotEncoder(sparse_output=False, handle_unknown='ignore')
encoded_cats = encoder.fit_transform(df[categorical_cols])
encoded_df = pd.DataFrame(encoded_cats, columns=encoder.get_feature_names_out(categorical_cols))

X = pd.concat([df[numeric_cols], encoded_df], axis=1)
y = df['is_anomaly'].astype(int)

# Split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.15, random_state=42, stratify=y)

# Scaling
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

results = {}

def evaluate(model, name, X_te, y_te, is_keras=False):
    if is_keras:
        y_prob = model.predict(X_te).flatten()
        y_pred = (y_prob > 0.5).astype(int)
    else:
        y_pred = model.predict(X_te)
    
    return {
        'accuracy': float(accuracy_score(y_te, y_pred)),
        'precision': float(precision_score(y_te, y_pred, zero_division=0)),
        'recall': float(recall_score(y_te, y_pred, zero_division=0)),
        'f1': float(f1_score(y_te, y_pred, zero_division=0))
    }

# --- 1. RANDOM FOREST ---
log_progress("Phase 1/3: Training Random Forest (Baseline)...")
rf = RandomForestClassifier(n_estimators=100, max_depth=15, random_state=42)
rf.fit(X_train_scaled, y_train)
results['random_forest'] = evaluate(rf, "RF", X_test_scaled, y_test)

# --- 2. SVM ---
log_progress("Phase 2/3: Training SVM (Professional RBF Kernel)...")
svm = SVC(probability=True, kernel='rbf', C=1.0, random_state=42)
svm.fit(X_train_scaled, y_train)
results['svm'] = evaluate(svm, "SVM", X_test_scaled, y_test)

# --- 3. NEURAL NETWORK (DEEP LEARNING) ---
if HAS_TF:
    log_progress("Phase 3/3: Training Deep Learning Neural Network...")
    input_dim = X_train_scaled.shape[1]
    
    nn = Sequential([
        Dense(64, activation='relu', input_dim=input_dim),
        Dropout(0.2),
        Dense(32, activation='relu'),
        Dropout(0.1),
        Dense(16, activation='relu'),
        Dense(1, activation='sigmoid')
    ])
    
    nn.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
    early_stop = EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True)
    
    nn.fit(
        X_train_scaled, y_train, 
        epochs=30, batch_size=32, validation_split=0.1,
        callbacks=[early_stop], verbose=1
    )
    
    results['deep_learning'] = evaluate(nn, "DL", X_test_scaled, y_test, is_keras=True)
    nn.save(os.path.join(base_dir, 'nn_model.keras'))

# Save core files
joblib.dump(rf, os.path.join(base_dir, 'rf_model.pkl'))
joblib.dump(svm, os.path.join(base_dir, 'svm_model.pkl'))
joblib.dump(scaler, os.path.join(base_dir, 'scaler.pkl'))
joblib.dump(encoder, os.path.join(base_dir, 'encoder.pkl'))

# Feature Importance
importances = rf.feature_importances_
importance_list = sorted([
    {'feature': name, 'importance': float(imp)} 
    for name, imp in zip(X.columns, importances)
], key=lambda x: x['importance'], reverse=True)

# Final Metrics
final_metrics = {
    'models': results,
    'feature_importance': importance_list[:12],
    'dataset_stats': {
        'total': int(len(df)),
        'anomalies': int(y.sum()),
        'ratio': float(y.mean())
    },
    'timestamp': pd.Timestamp.now().isoformat()
}

with open(os.path.join(base_dir, 'model_metrics.json'), 'w') as f:
    json.dump(final_metrics, f, indent=2)

log_progress("Research training COMPLETED. Results are now ready.")
