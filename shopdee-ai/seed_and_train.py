import os
import pandas as pd
import subprocess

base_dir = os.path.dirname(os.path.abspath(__file__))
dataset_path = os.path.abspath(os.path.join(base_dir, '..', 'backend', 'storage', 'app', 'ai_dataset.csv'))

def seed_initial_data():
    print("Seeding initial data for training...")
    data = []
    # Normal patterns (80%)
    for i in range(80):
        data.append({
            'user_id': 1, 'type': 'view_product', 'lat': 10.762622, 'lng': 106.660172, 
            'duration_ms': 5000 + (i * 10), 'distance_jump': 0, 'wrong_password_attempts': 0,
            'address_changes': 0, 'click_speed_ms': 500 + (i % 50), 'purchase_quantity': 1,
            'purchase_value': 100000, 'click_count': 5, 'is_anomaly': 0
        })
    # Fraud patterns (20%) - Brute force, Bot, Location jump
    for i in range(20):
        if i % 3 == 0: # Brute force
            data.append({
                'user_id': i + 10, 'type': 'login', 'lat': 10.76, 'lng': 106.66, 
                'duration_ms': 500, 'distance_jump': 0, 'wrong_password_attempts': 10,
                'address_changes': 0, 'click_speed_ms': 0, 'purchase_quantity': 0,
                'purchase_value': 0, 'click_count': 0, 'is_anomaly': 1
            })
        elif i % 3 == 1: # Bot click
            data.append({
                'user_id': i + 10, 'type': 'view_product', 'lat': 10.76, 'lng': 106.66, 
                'duration_ms': 1000, 'distance_jump': 0, 'wrong_password_attempts': 0,
                'address_changes': 0, 'click_speed_ms': 50, 'purchase_quantity': 0,
                'purchase_value': 0, 'click_count': 30, 'is_anomaly': 1
            })
        else: # Location jump
            data.append({
                'user_id': i + 10, 'type': 'login', 'lat': 40.7128, 'lng': -74.0060, 
                'duration_ms': 200, 'distance_jump': 15000, 'wrong_password_attempts': 1,
                'address_changes': 0, 'click_speed_ms': 0, 'purchase_quantity': 0,
                'purchase_value': 0, 'click_count': 0, 'is_anomaly': 1
            })
            
    df = pd.DataFrame(data)
    df.to_csv(dataset_path, index=False)
    print(f"Dataset created with {len(df)} samples.")

if __name__ == "__main__":
    seed_initial_data()
    print("Starting training...")
    subprocess.run(['python', os.path.join(base_dir, 'train.py')])
