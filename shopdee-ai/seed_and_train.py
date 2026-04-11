import os
import logging
import json
import pandas as pd
import numpy as np
import joblib
from datetime import datetime

# Machine Learning Imports
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from imblearn.over_sampling import SMOTE

# Deep Learning Imports
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping

# Thiết lập Logging chuyên nghiệp
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('training.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def create_directories():
    """Tạo các thư mục cần thiết để lưu trữ dữ liệu và model."""
    # Thư mục models nằm cùng cấp với script
    # Thư mục backend/storage/app nằm bên ngoài thư mục hiện tại
    paths = ['models', '../backend/storage/app']
    for path in paths:
        if not os.path.exists(path):
            os.makedirs(path, exist_ok=True)
            logger.info(f"Đã tạo thư mục: {path}")

def generate_synthetic_data(num_records=100000):
    """Phần 1: Tạo dữ liệu giả lập dựa trên logic hành vi thực tế (Fraud vs Normal)."""
    logger.info(f"Đang khởi tạo {num_records} bản ghi dữ liệu giả lập...")
    
    # Thiết lập tỷ lệ imbalanced (95% Normal, 5% Fraud)
    num_fraud = int(num_records * 0.05)
    num_normal = num_records - num_fraud
    
    # Logic cho dữ liệu bình thường
    normal_data = {
        'distance_km': np.random.exponential(scale=15, size=num_normal),
        'wrong_password_attempts': np.random.choice([0, 1], size=num_normal, p=[0.9, 0.1]),
        'click_speed_ms': np.random.normal(loc=3000, scale=800, size=num_normal).clip(300, 6000),
        'address_changes': np.random.choice([0, 1], size=num_normal, p=[0.95, 0.05]),
        'purchase_quantity': np.random.randint(1, 6, size=num_normal),
        'click_count': np.random.randint(5, 51, size=num_normal),
        'lat': np.random.uniform(8.1, 23.4, size=num_normal), 
        'lng': np.random.uniform(102.1, 109.5, size=num_normal),
        'type': np.random.choice(['login', 'navigate', 'add_to_cart', 'checkout'], size=num_normal),
        'is_anomaly': 0
    }
    
    # Logic cho hành vi gian lận (Bot/VPN/Brute-force)
    fraud_data = {
        'distance_km': np.random.uniform(500, 5000, size=num_fraud),
        'wrong_password_attempts': np.random.randint(3, 11, size=num_fraud), 
        'click_speed_ms': np.random.uniform(10, 301, size=num_fraud), 
        'address_changes': np.random.randint(2, 6, size=num_fraud),
        'purchase_quantity': np.random.randint(10, 51, size=num_fraud),
        'click_count': np.random.randint(100, 501, size=num_fraud),
        'lat': np.random.uniform(8.1, 23.4, size=num_fraud),
        'lng': np.random.uniform(102.1, 109.5, size=num_fraud),
        'type': np.random.choice(['login', 'navigate', 'add_to_cart', 'checkout'], size=num_fraud),
        'is_anomaly': 1
    }
    
    df = pd.concat([pd.DataFrame(normal_data), pd.DataFrame(fraud_data)]).sample(frac=1).reset_index(drop=True)
    
    # Tính các đặc trưng phái sinh
    df['duration_ms'] = df['click_count'] * df['click_speed_ms']
    df['purchase_value'] = df['purchase_quantity'] * np.random.uniform(100, 1000, size=num_records)
    
    csv_path = '../backend/storage/app/ai_dataset.csv'
    df.to_csv(csv_path, index=False)
    logger.info(f"Đã lưu tập dữ liệu tại: {csv_path}")
    return df

def preprocess_data(df):
    """Phần 2: Xử lý Encoding, Split, SMOTE và Scaling."""
    logger.info("Bắt đầu quy trình tiền xử lý dữ liệu...")
    
    X = df.drop('is_anomaly', axis=1)
    y = df['is_anomaly']
    
    # One-Hot Encoding
    encoder = OneHotEncoder(sparse_output=False, handle_unknown='ignore')
    type_encoded = encoder.fit_transform(X[['type']])
    type_cols = encoder.get_feature_names_out(['type'])
    X = pd.concat([X.drop('type', axis=1), pd.DataFrame(type_encoded, columns=type_cols)], axis=1)
    
    # Split dữ liệu
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.15, stratify=y, random_state=42)
    
    # Cân bằng dữ liệu TRAINING bằng SMOTE
    logger.info(f"Class distribution trước SMOTE: {dict(pd.Series(y_train).value_counts())}")
    smote = SMOTE(random_state=42)
    X_train_res, y_train_res = smote.fit_resample(X_train, y_train)
    logger.info(f"Class distribution sau SMOTE: {dict(pd.Series(y_train_res).value_counts())}")
    
    # Scaling
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train_res)
    X_test_scaled = scaler.transform(X_test)
    
    # Lưu Encoder và Scaler
    joblib.dump(encoder, 'models/encoder.pkl')
    joblib.dump(scaler, 'models/scaler.pkl')
    
    return X_train_scaled, X_test_scaled, y_train_res, y_test, X.columns

def train_and_evaluate(X_train, X_test, y_train, y_test, feature_names):
    """Phần 3: Huấn luyện RF, SVM và Deep Learning."""
    results = {}
    
    # 1. Random Forest
    logger.info("Đang huấn luyện Random Forest...")
    rf = RandomForestClassifier(n_estimators=100, max_depth=15, random_state=42)
    rf.fit(X_train, y_train)
    y_pred_rf = rf.predict(X_test)
    results['rf'] = rf
    
    # 2. SVM
    logger.info("Đang huấn luyện SVM (có thể mất vài phút)...")
    svm = SVC(kernel='rbf', probability=True, random_state=42)
    svm.fit(X_train, y_train)
    y_pred_svm = svm.predict(X_test)
    results['svm'] = svm
    
    # 3. Deep Learning
    logger.info("Đang xây dựng và huấn luyện Neural Network...")
    nn = Sequential([
        Dense(64, activation='relu', input_shape=(X_train.shape[1],)),
        Dropout(0.2),
        Dense(32, activation='relu'),
        Dropout(0.1),
        Dense(16, activation='relu'),
        Dense(1, activation='sigmoid')
    ])
    
    nn.compile(optimizer='adam', loss='binary_crossentropy', 
                 metrics=['accuracy', tf.keras.metrics.Precision(name='precision'), tf.keras.metrics.Recall(name='recall')])
    
    early_stop = EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True)
    
    nn.fit(X_train, y_train, validation_split=0.1, epochs=30, batch_size=64, callbacks=[early_stop], verbose=0)
    y_pred_nn = (nn.predict(X_test) > 0.5).astype(int)
    results['nn'] = nn

    # Thu thập và Log Metrics
    metrics_report = {}
    for name, model in results.items():
        if name == 'nn':
            pred = y_pred_nn
        elif name == 'rf':
            pred = y_pred_rf
        else:
            pred = y_pred_svm
            
        metrics_report[name] = {
            "accuracy": float(accuracy_score(y_test, pred)),
            "precision": float(precision_score(y_test, pred)),
            "recall": float(recall_score(y_test, pred)),
            "f1_score": float(f1_score(y_test, pred))
        }
        logger.info(f"Kết quả {name.upper()}: Recall={metrics_report[name]['recall']:.4f}, F1={metrics_report[name]['f1_score']:.4f}")

    # Feature Importance (RF)
    importances = rf.feature_importances_
    metrics_report['feature_importances'] = dict(sorted(zip(feature_names, importances.tolist()), key=lambda x: x[1], reverse=True))

    return results, metrics_report

def save_all(models, metrics):
    """Phần 4: Export artifacts."""
    logger.info("Đang lưu trữ các mô hình và metrics...")
    joblib.dump(models['rf'], 'models/rf_model.pkl')
    joblib.dump(models['svm'], 'models/svm_model.pkl')
    models['nn'].save('models/nn_model.keras')
    
    with open('models/model_metrics.json', 'w', encoding='utf-8') as f:
        json.dump(metrics, f, indent=4, ensure_ascii=False)
    logger.info("Quy trình AI hoàn tất. Scripts và Models đã sẵn sàng.")

if __name__ == "__main__":
    try:
        start_time = datetime.now()
        logger.info("===== KHỞI ĐỘNG HỆ THỐNG AI TRAINING =====")
        create_directories()
        data = generate_synthetic_data(100000)
        X_train, X_test, y_train, y_test, feats = preprocess_data(data)
        models, metrics = train_and_evaluate(X_train, X_test, y_train, y_test, feats)
        save_all(models, metrics)
        logger.info(f"===== HOÀN TẤT SAU: {datetime.now() - start_time} =====")
    except Exception as e:
        logger.error(f"LỖI HỆ THỐNG: {str(e)}", exc_info=True)
