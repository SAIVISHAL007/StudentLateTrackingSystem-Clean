"""
ML Prediction Script - Generates AI insights for students
Can be run standalone or imported as a module

Usage: python predict.py
"""

import os
import sys
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
from pymongo import MongoClient
import joblib
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

MODEL_PATH = os.path.join('models', 'late_predictor.pkl')
FEATURES_PATH = os.path.join('models', 'feature_names.pkl')

def load_model():
    """Load trained model and feature names"""
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model not found at {MODEL_PATH}. Run train_model.py first.")
    
    model = joblib.load(MODEL_PATH)
    feature_names = joblib.load(FEATURES_PATH)
    return model, feature_names

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
    
    day_counts = [0] * 7
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

def extract_features_for_student(student):
    """Extract features for a single student"""
    late_logs = student.get('lateLogs', [])
    
    return {
        'total_late_days': student.get('lateDays', 0),
        'current_semester': student.get('semester', 1),
        'year': student.get('year', 1),
        'branch_encoded': encode_branch(student.get('branch', '')),
        'grace_period_used': 1 if student.get('gracePeriodUsed', False) else 0,
        'day_pattern': calculate_day_pattern(late_logs),
        'recent_trend': calculate_recent_trend(late_logs),
        'late_per_semester': student.get('lateDays', 0) / max(student.get('semester', 1), 1)
    }

def predict_risk_score(student, model, feature_names):
    """Predict risk score for a single student"""
    features = extract_features_for_student(student)
    feature_df = pd.DataFrame([features])[feature_names]
    
    # Get probability of being high risk
    risk_probability = model.predict_proba(feature_df)[0][1]
    risk_score = int(risk_probability * 100)
    
    # Categorize
    if risk_score >= 70:
        risk_category = 'HIGH'
    elif risk_score >= 40:
        risk_category = 'MEDIUM'
    else:
        risk_category = 'LOW'
    
    return {
        'risk_score': risk_score,
        'risk_category': risk_category,
        'risk_probability': round(risk_probability, 3)
    }

def analyze_patterns(students):
    """Analyze patterns across all students"""
    if not students:
        return {}
    
    # Day of week analysis
    day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    day_counts = [0] * 7
    
    for student in students:
        for log in student.get('lateLogs', []):
            date = log.get('date')
            if date:
                day_counts[date.weekday()] += 1
    
    peak_day_index = day_counts.index(max(day_counts)) if any(day_counts) else 0
    
    # Branch analysis
    branch_stats = {}
    for student in students:
        branch = student.get('branch', 'Unknown')
        if branch not in branch_stats:
            branch_stats[branch] = {'count': 0, 'total_lates': 0}
        branch_stats[branch]['count'] += 1
        branch_stats[branch]['total_lates'] += student.get('lateDays', 0)
    
    # Calculate percentages
    branch_percentages = {}
    total_lates = sum(stats['total_lates'] for stats in branch_stats.values())
    for branch, stats in branch_stats.items():
        if total_lates > 0:
            branch_percentages[branch] = round((stats['total_lates'] / total_lates) * 100, 1)
    
    # Year analysis
    year_stats = {}
    for student in students:
        year = student.get('year', 0)
        if year not in year_stats:
            year_stats[year] = []
        year_stats[year].append(student.get('lateDays', 0))
    
    year_averages = {
        year: round(sum(lates) / len(lates), 1) if lates else 0
        for year, lates in year_stats.items()
    }
    
    return {
        'peak_late_day': {
            'day': day_names[peak_day_index],
            'count': day_counts[peak_day_index],
            'day_breakdown': {day_names[i]: day_counts[i] for i in range(7)}
        },
        'branch_distribution': branch_percentages,
        'year_averages': year_averages,
        'total_students_analyzed': len(students),
        'students_with_lates': sum(1 for s in students if s.get('lateDays', 0) > 0)
    }

def get_early_warnings(students):
    """Identify students needing early intervention"""
    warnings = []
    
    for student in students:
        late_days = student.get('lateDays', 0)
        status = student.get('status', '')
        
        # Near fine threshold
        if 7 <= late_days <= 9 and status != 'Being Fined':
            warnings.append({
                'student_id': str(student.get('_id')),
                'roll_no': student.get('rollNo'),
                'name': student.get('name'),
                'late_days': late_days,
                'warning_type': 'NEAR_THRESHOLD',
                'message': f'{10 - late_days} more late days until fine threshold',
                'severity': 'HIGH'
            })
        
        # Sudden increase
        recent_trend = calculate_recent_trend(student.get('lateLogs', []))
        if recent_trend > 0.5 and late_days >= 3:
            warnings.append({
                'student_id': str(student.get('_id')),
                'roll_no': student.get('rollNo'),
                'name': student.get('name'),
                'late_days': late_days,
                'warning_type': 'SUDDEN_INCREASE',
                'message': f'Late frequency increased by {int(recent_trend*100)}%',
                'severity': 'MEDIUM'
            })
    
    return sorted(warnings, key=lambda x: (x['severity'] == 'HIGH', x['late_days']), reverse=True)

def generate_insights(db=None):
    """Generate all AI insights"""
    if db is None:
        MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/studentLateTracker')
        client = MongoClient(MONGODB_URI)
        db = client.get_database()
    
    # Load model
    try:
        model, feature_names = load_model()
    except FileNotFoundError as e:
        return {'error': str(e)}
    
    # Get all students
    students = list(db.students.find({}))
    
    # Predict risk scores
    predictions = []
    for student in students:
        if student.get('lateDays', 0) > 0:  # Only predict for students with history
            risk = predict_risk_score(student, model, feature_names)
            predictions.append({
                'student_id': str(student.get('_id')),
                'roll_no': student.get('rollNo'),
                'name': student.get('name'),
                'branch': student.get('branch'),
                'year': student.get('year'),
                'late_days': student.get('lateDays', 0),
                **risk
            })
    
    # Sort by risk score
    predictions.sort(key=lambda x: x['risk_score'], reverse=True)
    
    # Get patterns
    patterns = analyze_patterns(students)
    
    # Get early warnings
    warnings = get_early_warnings(students)
    
    return {
        'predictions': predictions[:20],  # Top 20 high-risk students
        'patterns': patterns,
        'early_warnings': warnings[:10],  # Top 10 warnings
        'summary': {
            'total_students': len(students),
            'high_risk_count': sum(1 for p in predictions if p['risk_category'] == 'HIGH'),
            'medium_risk_count': sum(1 for p in predictions if p['risk_category'] == 'MEDIUM'),
            'low_risk_count': sum(1 for p in predictions if p['risk_category'] == 'LOW'),
            'warnings_count': len(warnings)
        }
    }

def main():
    """CLI interface for predictions"""
    print("🤖 Generating AI Insights...")
    
    insights = generate_insights()
    
    if 'error' in insights:
        print(f"\n❌ Error: {insights['error']}")
        return
    
    print(f"\n📊 Summary:")
    print(f"   Total Students: {insights['summary']['total_students']}")
    print(f"   High Risk: {insights['summary']['high_risk_count']}")
    print(f"   Medium Risk: {insights['summary']['medium_risk_count']}")
    print(f"   Low Risk: {insights['summary']['low_risk_count']}")
    print(f"   Warnings: {insights['summary']['warnings_count']}")
    
    print(f"\n🎯 Top 5 High-Risk Students:")
    for i, pred in enumerate(insights['predictions'][:5], 1):
        print(f"   {i}. {pred['name']} ({pred['roll_no']}) - Risk: {pred['risk_score']}%")
    
    print(f"\n⚠️  Early Warnings:")
    for warning in insights['early_warnings'][:5]:
        print(f"   • {warning['name']}: {warning['message']}")

if __name__ == "__main__":
    main()
