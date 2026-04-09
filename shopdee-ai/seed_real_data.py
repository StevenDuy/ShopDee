import pandas as pd
import numpy as np
import os
import random

# --- CONFIG ---
base_dir = os.path.dirname(os.path.abspath(__file__))
dataset_path = os.path.abspath(os.path.join(base_dir, '..', 'backend', 'storage', 'app', 'ai_dataset.csv'))

print(f"Generating 50,000 realistic AI samples for Deep Learning research...")

def add_noise(val, noise_level=0.05):
    """Add Gaussian noise to a value."""
    if isinstance(val, (int, float)):
        return val + np.random.normal(0, val * noise_level) if val != 0 else np.random.normal(0, 1)
    return val

def generate_enhanced_data(num_samples=50000):
    data = []
    
    # Ratios: 60% Normal, 40% Anomalies (including overlapping cases)
    scenarios = [
        # Normal scenarios (Label 0)
        {'name': 'Normal Baseline', 'label': 0, 'weight': 40},
        {'name': 'Traveling User', 'label': 0, 'weight': 10},
        {'name': 'Power User', 'label': 0, 'weight': 5},
        {'name': 'Elderly/Slow User', 'label': 0, 'weight': 5},
        
        # Anomaly scenarios (Label 1)
        {'name': 'Brute Force Hacker', 'label': 1, 'weight': 15},
        {'name': 'Stealth Hacker', 'label': 1, 'weight': 10},
        {'name': 'Scalper Bot', 'label': 1, 'weight': 10},
        {'name': 'Address Multiplexer', 'label': 1, 'weight': 5}
    ]
    
    weights = [s['weight'] for s in scenarios]
    
    for _ in range(num_samples):
        scenario = random.choices(scenarios, weights=weights)[0]
        label = scenario['label']
        
        # Default values
        wrong_pass = random.choices([0, 1, 2, 3], weights=[80, 10, 7, 3])[0] if label == 0 else 0
        click_speed = random.randint(300, 1000)
        dist_km = random.uniform(0, 10)
        duration = random.randint(5000, 30000)
        purchase_qty = random.randint(0, 2)
        purchase_val = random.uniform(0, 500)
        click_cnt = random.randint(5, 20)
        addr_changes = 0
        
        # Scenario adjustments
        if scenario['name'] == 'Traveling User':
            dist_km = random.uniform(500, 5000) # Traveling far
            duration = random.randint(1000, 5000)
            
        elif scenario['name'] == 'Power User':
            click_speed = random.randint(50, 150) # Very fast but human
            click_cnt = random.randint(50, 150)
            
        elif scenario['name'] == 'Elderly/Slow User':
            duration = random.randint(60000, 300000)
            click_speed = random.randint(1000, 5000)
            
        elif scenario['name'] == 'Brute Force Hacker':
            wrong_pass = random.randint(5, 50)
            click_speed = random.randint(5, 50)
            dist_km = random.uniform(1000, 20000)
            label = 1
            
        elif scenario['name'] == 'Stealth Hacker':
            wrong_pass = random.randint(1, 4) # Hard to detect
            click_speed = random.randint(400, 800) # Mimics human
            dist_km = random.uniform(10, 100)
            duration = random.randint(10000, 20000)
            label = 1
            
        elif scenario['name'] == 'Scalper Bot':
            click_speed = random.randint(1, 20)
            purchase_qty = random.randint(50, 200)
            purchase_val = random.uniform(5000, 50000)
            click_cnt = random.randint(100, 500)
            label = 1
            
        elif scenario['name'] == 'Address Multiplexer':
            addr_changes = random.randint(5, 20)
            click_cnt = random.randint(20, 50)
            label = 1

        # Add Gaussian Jitter (Noise) to numeric features
        row = {
            'user_id': random.randint(1, 1000),
            'type': random.choice(['login', 'view_product', 'checkout', 'navigate']),
            'lat': 10.7 + random.uniform(-5, 5),
            'lng': 106.6 + random.uniform(-10, 10),
            'duration_ms': max(0, add_noise(duration)),
            'distance_jump': max(0, add_noise(dist_km)), # Alias for distance_km for backward compat if needed
            'wrong_password_attempts': wrong_pass,
            'address_changes': addr_changes,
            'click_speed_ms': max(1, int(add_noise(click_speed))),
            'purchase_quantity': purchase_qty,
            'purchase_value': max(0, add_noise(purchase_val)),
            'click_count': max(0, int(add_noise(click_cnt))),
            'distance_km': max(0, add_noise(dist_km)),
            'is_anomaly': label
        }
        
        # 3% Label Noise (Intentional mislabeling)
        if random.random() < 0.03:
            row['is_anomaly'] = 1 - row['is_anomaly']
            
        data.append(row)

    df = pd.DataFrame(data)
    # Shuffle
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    
    os.makedirs(os.path.dirname(dataset_path), exist_ok=True)
    df.to_csv(dataset_path, index=False)
    
    print(f"Success! Saved {len(df)} samples to: {dataset_path}")
    print("\nLabel Distribution:")
    print(df['is_anomaly'].value_counts(normalize=True))
    print("\nScenario Weights (Target):")
    for s in scenarios:
        print(f"- {s['name']}: {s['weight']}%")

if __name__ == "__main__":
    generate_enhanced_data(50000)
