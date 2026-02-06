"""
ML Model Training Script for Student Late Prediction
Analyzes historical late data to predict high-risk students

Usage: python train_model.py
Output: models/late_predictor.pkl
"""

import os
import sys
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
from pymongo import MongoClient
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import joblib
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB connection
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/studentLateTracker')

def connect_db():
    """Connect to MongoDB"""
    try:
        client = MongoClient(MONGODB_URI)
        db = client.get_database()
        print("✅ Connected to MongoDB")
        return db
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        sys.exit(1)

def encode_branch(branch):
    """Encode branch to numerical value"""
    branch_map = {
        'CSE': 1, 'ECE': 2, 'MECH': 3, 'EEE': 4, 
        'CIVIL': 5, 'CSM': 6, 'IT': 7
    }
    return branch_map.get(branch, 0)

def calculate_day_pattern(late_logs):
    """Calculate which day of week student is most late"""
    if not late_logs or len(late_logs) == 0:
        return 0
    
    day_counts = [0] * 7  # Monday=0, Sunday=6
    for log in late_logs:
        date = log.get('date')
        if date:
            day_of_week = date.weekday()
            day_counts[day_of_week] += 1
    
    return day_counts.index(max(day_counts)) if any(day_counts) else 0

def calculate_recent_trend(late_logs):
    """Calculate if student's late frequency is increasing"""
    if not late_logs or len(late_logs) < 4:
        return 0
    
    # Compare last 2 weeks vs previous 2 weeks
    now = datetime.now()
    two_weeks_ago = now - timedelta(days=14)
    four_weeks_ago = now - timedelta(days=28)
    
    recent_count = sum(1 for log in late_logs 
                      if log.get('date') and log['date'] >= two_weeks_ago)
    previous_count = sum(1 for log in late_logs 
                        if log.get('date') and 
                        four_weeks_ago <= log['date'] < two_weeks_ago)
    
    if previous_count == 0:
        return 1 if recent_count > 0 else 0
    
    return (recent_count - previous_count) / previous_count

def extract_features(students):
    """Extract features from student data for ML model"""
    features = []
    labels = []
    
    for student in students:
        # Skip if not enough data
        if student.get('lateDays', 0) < 1:
            continue
        
        late_logs = student.get('lateLogs', [])
        
        # Feature engineering
        feature_vector = {
            'total_late_days': student.get('lateDays', 0),
            'current_semester': student.get('semester', 1),
            'year': student.get('year', 1),
            'branch_encoded': encode_branch(student.get('branch', '')),
            'grace_period_used': 1 if student.get('gracePeriodUsed', False) else 0,
            'day_pattern': calculate_day_pattern(late_logs),
            'recent_trend': calculate_recent_trend(late_logs),
            'late_per_semester': student.get('lateDays', 0) / max(student.get('semester', 1), 1)
        }
        
        # Label: Will student be late again? (1 if lateDays > 3, else 0)
        # This is a simplified label - in production, you'd use actual future data
        label = 1 if student.get('lateDays', 0) >= 3 else 0
        
        features.append(feature_vector)
        labels.append(label)
    
    return pd.DataFrame(features), np.array(labels)

def train_model(db):
    """Train the ML model"""
    print("\n📊 Fetching student data...")
    students = list(db.students.find({}))
    print(f"Found {len(students)} students")
    
    print("\n🔧 Extracting features...")
    X, y = extract_features(students)
    
    if len(X) < 10:
        print("❌ Not enough data to train model (need at least 10 students with late records)")
        return None
    
    print(f"✅ Extracted {len(X)} training samples")
    print(f"   Features: {list(X.columns)}")
    print(f"   High risk students: {sum(y)} ({sum(y)/len(y)*100:.1f}%)")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y if len(np.unique(y)) > 1 else None
    )
    
    print("\n🤖 Training Random Forest model...")
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        min_samples_split=5,
        random_state=42,
        class_weight='balanced'  # Handle imbalanced data
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    print(f"\n✅ Model trained successfully!")
    print(f"   Accuracy: {accuracy*100:.2f}%")
    print(f"\n📈 Classification Report:")
    print(classification_report(y_test, y_pred, target_names=['Low Risk', 'High Risk']))
    
    # Feature importance
    feature_importance = pd.DataFrame({
        'feature': X.columns,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print("\n🎯 Feature Importance:")
    for _, row in feature_importance.iterrows():
        print(f"   {row['feature']}: {row['importance']:.4f}")
    
    return model, X.columns.tolist()

def save_model(model, feature_names):
    """Save trained model and feature names"""
    model_path = os.path.join('models', 'late_predictor.pkl')
    features_path = os.path.join('models', 'feature_names.pkl')
    
    joblib.dump(model, model_path)
    joblib.dump(feature_names, features_path)
    
    print(f"\n💾 Model saved to: {model_path}")
    print(f"💾 Features saved to: {features_path}")

def main():
    """Main training pipeline"""
    print("=" * 60)
    print("🎓 Student Late Prediction Model Training")
    print("=" * 60)
    
    # Connect to database
    db = connect_db()
    
    # Train model
    result = train_model(db)
    
    if result is None:
        print("\n❌ Training failed - insufficient data")
        return
    
    model, feature_names = result
    
    # Save model
    save_model(model, feature_names)
    
    print("\n" + "=" * 60)
    print("✅ Training complete!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Deploy model to backend/services/")
    print("2. Create API endpoint for predictions")
    print("3. Integrate with frontend dashboard")

if __name__ == "__main__":
    main()
