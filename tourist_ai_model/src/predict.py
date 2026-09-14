import joblib
import pandas as pd
import numpy as np


# ==========================================
# LOAD MODEL
# ==========================================

MODEL_PATH = "models/tourist_safety_model.pkl"
FEATURES_PATH = "models/features.pkl"

model = joblib.load(MODEL_PATH)
features = joblib.load(FEATURES_PATH)


# ==========================================
# RISK CLASSIFICATION
# ==========================================

def classify_risk(score):

    if score >= 80:
        return "VERY SAFE"

    elif score >= 65:
        return "SAFE"

    elif score >= 50:
        return "MODERATE"

    elif score >= 30:
        return "RISKY"

    else:
        return "HIGH RISK"


# ==========================================
# RECOMMENDATION
# ==========================================

def generate_recommendation(score):

    if score >= 80:
        return "Generally very safe for tourists."

    elif score >= 65:
        return "Generally safe for tourists with normal precautions."

    elif score >= 50:
        return "Moderate safety conditions. Tourists should remain cautious."

    elif score >= 30:
        return "Higher risk detected. Extra caution is recommended."

    else:
        return "High risk detected. Consider avoiding the area if possible."


# ==========================================
# PREDICTION FUNCTION
# ==========================================

def predict_safety(area_data):

    input_data = pd.DataFrame(
        [area_data],
        columns=features
    )

    prediction = model.predict(input_data)[0]

    # Keep score within 0–100
    prediction = float(
        np.clip(prediction, 0, 100)
    )

    risk = classify_risk(prediction)

    recommendation = generate_recommendation(
        prediction
    )

    return {
        "tourist_safety_score": round(prediction, 2),
        "risk_level": risk,
        "recommendation": recommendation
    }


# ==========================================
# TEST DATA
# ==========================================

test_area = {

    "crime_risk_index": 25,

    "accident_risk_index": 30,

    "road_condition_score": 85,

    "sanitation_hygiene_score": 90,

    "public_review_score": 92,

    "emergency_access_score": 88,

    "environment_score": 80,

    "infrastructure_score": 85,

    "tourist_facilities_score": 90

}


# ==========================================
# RUN PREDICTION
# ==========================================

result = predict_safety(test_area)


print("\n====================================")
print("     ATITHIBANDHU AI PREDICTION")
print("====================================")

print(
    "Tourist Safety Score:",
    result["tourist_safety_score"]
)

print(
    "Risk Level:",
    result["risk_level"]
)

print(
    "Recommendation:",
    result["recommendation"]
)

print("====================================")