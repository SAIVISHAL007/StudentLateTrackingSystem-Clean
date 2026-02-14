# ML Model Training Guide - Trial Period (1-2 Weeks)

## Overview
This guide ensures ML models are trained well during faculty trials **WITHOUT breaking existing functionality** or changing how pages work.

---

## Current ML System

### Current Features Used
- **total_late_days**: Total late count
- **current_semester**: Current semester (1-8)
- **year**: Year level (1-4)
- **branch_encoded**: Branch (CSE, ECE, MECH, etc.)
- **grace_period_used**: Whether student used grace period
- **day_pattern**: Most common day of week for lateness
- **recent_trend**: Is lateness increasing/decreasing
- **late_per_semester**: Average late per semester

### System Safety
✅ **No changes to existing pages** - ML only provides AI Insights tab
✅ **Non-breaking** - Graceful fallback if model unavailable
✅ **Read-only** - ML predictions don't modify data
✅ **Separate storage** - Models in `/ml-models/models/` directory

---

## Trial Period Strategy (Week 1-2)

### Phase 1: Data Collection (Days 1-5)
**Goal**: Collect real usage patterns from faculty trials

1. **Automated Logging**
   - All new late records automatically flow to MongoDB
   - No manual intervention needed
   - Keep `/ml-models/models/` directory intact initially

2. **Recommended**: Let faculty use system for 4-5 days
   - Mark students late normally
   - Use Student Portal features
   - Access Fine Management tab
   - Test on mobile/desktop

### Phase 2: First Model Training (Day 5-6)
**Goal**: Train initial model on collected data

1. **Run Training Script**
   ```bash
   cd ml-models
   python train_model.py
   ```

2. **What it does**:
   - Connects to MongoDB
   - Extracts features from all students
   - Trains RandomForest classifier
   - Saves model to `models/late_predictor.pkl`
   - Saves feature names to `models/feature_names.pkl`

3. **Expected Output**:
   ```
   ✅ Connected to MongoDB
   📊 Total students processed: 150
   📈 Model training complete
   🎯 Accuracy: 85-92%
   ✅ Model saved: models/late_predictor.pkl
   ```

4. **Safety Check**:
   - If model training fails → AI Insights tab shows "No data yet"
   - No error disrupts other pages
   - Faculty can continue using system normally

### Phase 3: Continuous Model Improvement (Days 7-14)
**Goal**: Iteratively improve model accuracy

1. **Weekly Retraining** (Recommend: Every 3-4 days)
   ```bash
   cd ml-models
   python train_model.py
   ```

2. **Collect Feedback**
   - Ask faculty: "Are AI predictions accurate?"
   - Note any anomalies or unexpected predictions
   - Document student behavior patterns

3. **Monitor Model Health**
   - Check AI Insights tab in AdminManagement
   - Verify predictions make sense
   - No predictions = model still training (not an error)

---

## Data Collection Best Practices

### What the Model Learns From (Automatically)
✅ Late records (date, time, reason)
✅ Student year, semester, branch
✅ Grace period usage
✅ Fines paid/pending
✅ Late day frequency patterns

### What NOT to Change
❌ Don't modify `/ml-models/` directory during trials
❌ Don't delete late records after marking
❌ Don't rename/move `models/` subdirectory
❌ Keep student data unchanged for consistency

### Data Quality Tips
✅ Mark students consistently (use Record page normally)
✅ Include reason when marking (helps pattern recognition)
✅ Use Student Portal - teaches model about student access patterns
✅ Test Fine Management - helps model correlate fines with behavior

---

## Integration Points (No Changes Required)

### AI Insights Tab
- **Location**: AdminManagement → AI Insights tab
- **How it works**: 
  - Loads trained model automatically
  - Generates risk predictions
  - Shows recommendations
- **Status**: Graceful fallback if model unavailable

### Making Predictions
- **Automatic**: Every page load fetches latest model
- **Cached**: Results cached for 5 minutes
- **Safe**: Never modifies student data
- **Error-tolerant**: Shows "No predictions" if model missing

### API Endpoint (Backend)
- **Route**: `POST /students/ai-predict`
- **Input**: Student data from database
- **Output**: Risk score (0-100) + category
- **Status**: Unchanged - works as-is

---

## Training Tips for Better Accuracy

### Larger Dataset = Better Model
- Recommendation: Train after 100+ late records
- Current approach: Works with any dataset size
- Accuracy improves with: More diverse data, More semesters

### Feature Importance (Auto-Learned)
The model automatically learns which features matter most:
- Total late days → Strong predictor
- Recent trend → Shows behavior change
- Day pattern → Identifies habitual tardiness
- Semester/Year → Contextual factors

### Validation
Check model quality:
```bash
python train_model.py  # Shows accuracy metrics
```
- Accuracy: Should be 80%+
- If < 70%: Not enough data, retrain later

---

## What Stays Unchanged (Protected)

### Frontend Pages (No Changes)
✅ Mark Late (Record page) - works normally
✅ Late List - works normally
✅ Analytics - works normally
✅ AdminManagement - only AI Insights tab affected
✅ StudentManagement - works normally
✅ Student Portal - works normally
✅ FacultyDirectory - works normally
✅ Fine Management - works normally

### Backend APIs (No Changes)
✅ All student routes unchanged
✅ All late marking endpoints unchanged
✅ All authentication endpoints unchanged
✅ AI prediction endpoint works independently

### Database Schema (No Changes)
✅ Student collection unchanged
✅ Late records unchanged
✅ Faculty collection unchanged
✅ Audit logs unchanged

---

## Emergency Procedures

### If Model Training Fails
1. System continues working normally
2. AI Insights tab shows "No predictions available"
3. Delete `models/late_predictor.pkl` to reset
4. Try training again: `python train_model.py`

### If Predictions Seem Wrong
1. Check data in Record page (verify late records)
2. Check model accuracy in training output
3. Collect more data (train with 150+ records minimum)
4. Retrain model: `python train_model.py`

### If AI Insights Tab Crashes
1. Check browser console for errors
2. Refresh page
3. Check if model file exists: `models/late_predictor.pkl`
4. Retrain if needed

---

## Monitoring Model Performance

### Metrics to Track
```
Training Accuracy: Target 85%+
Predictions per day: Should increase
High-risk students identified: 5-10% of population
Model files size: ~500KB-1MB
```

### Testing AI Predictions
1. Go to AdminManagement → AI Insights tab
2. Look at top 5 high-risk students
3. Ask faculty: "Do these students seem at-risk?"
4. If 80%+ match faculty intuition → Model is good

---

## Timeline for Faculty Trials

| Day | ML Action | System Status |
|-----|-----------|---------------|
| 1-4 | Collect data | Normal operation |
| 5 | First training | Ready for prediction |
| 6 | Verify predictions | Feedback from faculty |
| 7-10 | Second training | Model improves |
| 11-14 | Final training | Optimization |

---

## For Developers: Restoring Model After Trials

### If you need to reset for next batch:
```bash
# Delete old models
rm ml-models/models/late_predictor.pkl
rm ml-models/models/feature_names.pkl

# Train fresh from new data
cd ml-models
python train_model.py
```

### For Production Deployment:
1. Train model locally with complete dataset
2. Copy `models/` folder to production
3. No Python dependencies needed on server (model is binary)
4. Backend loads `.pkl` file only

---

## Success Criteria

✅ **Trial ends successfully when:**
- Model trained with 150+ student records
- AI Insights predictions match faculty intuition
- No errors in logs
- All pages work normally
- Model accuracy 85%+

---

## Key Principle

> **ML improves the system WITHOUT changing how system works**

- Existing features work exactly the same
- AI predictions are additive (guidance, not enforcement)
- Data collection happens automatically
- No user retraining needed

This approach ensures faculty can evaluate AI features risk-free during trials.

