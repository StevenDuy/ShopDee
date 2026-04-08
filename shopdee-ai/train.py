import json
import os
import joblib
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.svm import SVC

base_dir = os.path.dirname(os.path.abspath(__file__))
dataset_path = os.path.abspath(os.path.join(base_dir, '..', 'backend', 'storage', 'app', 'ai_dataset.csv'))

if not os.path.exists(dataset_path) or os.path.getsize(dataset_path) == 0:
    print("Dataset empty or not found. Seeding with initial data...")
    # Seed logic if needed, but for now we expect a populated dataset
    # We will provide a seeder script separate from this
    raise FileNotFoundError(f"Dataset not ready at {dataset_path}")

print(f"Loading dataset from {dataset_path}...")
df = pd.read_csv(dataset_path)

numeric_cols = [
    'lat', 'lng', 'duration_ms', 'distance_jump', 
    'wrong_password_attempts', 'address_changes', 
    'click_speed_ms', 'purchase_quantity', 'purchase_value', 'click_count'
]

# Ensure columns exist
for col in numeric_cols:
    if col not in df.columns:
        df[col] = 0
    df[col] = df[col].fillna(0)

if 'type' not in df.columns:
    df['type'] = 'unknown'

if 'is_anomaly' not in df.columns:
    raise ValueError('Dataset missing target column: is_anomaly')

# Categorical Encoding
categorical_cols = ['type']
encoder = OneHotEncoder(sparse_output=False, handle_unknown='ignore')
encoded_cats = encoder.fit_transform(df[categorical_cols])
encoded_df = pd.DataFrame(encoded_cats, columns=encoder.get_feature_names_out(categorical_cols))

X = pd.concat([df[numeric_cols], encoded_df], axis=1)
y = df['is_anomaly'].astype(int)

# Split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# Scaling
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

def train_and_evaluate(model, name, X_tr, X_te, y_tr, y_te):
    model.fit(X_tr, y_tr)
    y_pred = model.predict(X_te)
    
    metrics = {
        'accuracy': float(accuracy_score(y_te, y_pred)),
        'precision': float(precision_score(y_te, y_pred, zero_division=0)),
        'recall': float(recall_score(y_te, y_pred, zero_division=0)),
        'f1': float(f1_score(y_te, y_pred, zero_division=0))
    }
    print(f"{name} Results: {metrics}")
    return model, metrics

# Random Forest
rf_model, rf_metrics = train_and_evaluate(
    RandomForestClassifier(n_estimators=100, random_state=42), 
    "Random Forest", X_train_scaled, X_test_scaled, y_train, y_test
)

# SVM
svm_model, svm_metrics = train_and_evaluate(
    SVC(probability=True, kernel='rbf', random_state=42), 
    "SVM", X_train_scaled, X_test_scaled, y_train, y_test
)

# Save
joblib.dump(rf_model, os.path.join(base_dir, 'rf_model.pkl'))
joblib.dump(svm_model, os.path.join(base_dir, 'svm_model.pkl'))
joblib.dump(scaler, os.path.join(base_dir, 'scaler.pkl'))
joblib.dump(encoder, os.path.join(base_dir, 'encoder.pkl'))

final_metrics = {
    'random_forest': rf_metrics,
    'svm': svm_metrics,
    'feature_names': list(X.columns),
    'training_samples': int(len(df)),
    'timestamp': pd.Timestamp.now().isoformat()
}

with open(os.path.join(base_dir, 'model_metrics.json'), 'w') as f:
    json.dump(final_metrics, f, indent=2)

print('Training completed. Metrics saved to model_metrics.json.')
