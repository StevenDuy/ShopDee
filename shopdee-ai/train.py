import json
import os

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.svm import SVC

base_dir = os.path.dirname(os.path.abspath(__file__))
dataset_path = os.path.abspath(os.path.join(base_dir, '..', 'backend', 'storage', 'app', 'ai_dataset.csv'))

if not os.path.exists(dataset_path):
    raise FileNotFoundError(f"Dataset not found at {dataset_path}")

print(f"Loading dataset from {dataset_path}...")

df = pd.read_csv(dataset_path)

numeric_cols = [
    'lat',
    'lng',
    'duration_ms',
    'distance_jump',
    'wrong_password_attempts',
    'address_changes',
    'click_speed_ms',
    'purchase_quantity',
    'purchase_value',
    'click_count',
]

for col in numeric_cols:
    df[col] = df.get(col, 0).fillna(0)

if 'type' not in df.columns:
    raise ValueError('Dataset missing required column: type')

if 'is_anomaly' not in df.columns:
    raise ValueError('Dataset missing required column: is_anomaly')

if df['type'].isnull().any():
    df['type'] = df['type'].fillna('unknown')

categorical_cols = ['type']
encoder = OneHotEncoder(sparse_output=False, handle_unknown='ignore')
encoded_cats = encoder.fit_transform(df[categorical_cols])
encoded_df = pd.DataFrame(encoded_cats, columns=encoder.get_feature_names_out(categorical_cols))

X = pd.concat([df[numeric_cols], encoded_df], axis=1)
y = df['is_anomaly'].astype(int)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

rf_model = RandomForestClassifier(random_state=42)
rf_model.fit(X_train_scaled, y_train)
rf_pred = rf_model.predict(X_test_scaled)
rf_accuracy = accuracy_score(y_test, rf_pred)
print(f"Random Forest Accuracy: {rf_accuracy:.4f}")

svm_model = SVC(probability=True, random_state=42)
svm_model.fit(X_train_scaled, y_train)
svm_pred = svm_model.predict(X_test_scaled)
svm_accuracy = accuracy_score(y_test, svm_pred)
print(f"SVM Accuracy: {svm_accuracy:.4f}")

joblib.dump(rf_model, os.path.join(base_dir, 'rf_model.pkl'))
joblib.dump(svm_model, os.path.join(base_dir, 'svm_model.pkl'))
joblib.dump(scaler, os.path.join(base_dir, 'scaler.pkl'))
joblib.dump(encoder, os.path.join(base_dir, 'encoder.pkl'))

metrics = {
    'random_forest_accuracy': float(rf_accuracy),
    'svm_accuracy': float(svm_accuracy),
    'feature_names': list(X.columns),
    'training_samples': int(len(df)),
}

with open(os.path.join(base_dir, 'model_metrics.json'), 'w') as f:
    json.dump(metrics, f, indent=2)

print('Models and scaler saved successfully.')
