import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


# ============================================================
# 1. LOAD DATA
# ============================================================

DATA_PATH = "data/india_tourist_safety_200000.csv"

print("Loading dataset...")

df = pd.read_csv(
    DATA_PATH,
    low_memory=False
)

print(f"Dataset loaded: {len(df):,} rows")


# ============================================================
# 2. FEATURES
# ============================================================

features = [
    "latitude",
    "longitude",
    "tourist_destination",

    "crime_incident_rate",
    "violent_crime_risk",
    "theft_risk",
    "harassment_risk",
    "accident_risk",

    "road_quality",
    "road_condition",
    "traffic_density",
    "road_lighting",
    "pedestrian_safety",

    "sanitation_score",
    "hygiene_score",
    "air_quality_score",
    "water_quality_score",
    "waste_management_score",
    "environmental_quality",

    "review_score",
    "review_count",
    "review_sentiment",
    "tourist_satisfaction",

    "hospital_access_score",
    "police_access_score",
    "fire_station_access_score",
    "ambulance_access_score",
    "emergency_response_score",

    "mobile_connectivity",
    "internet_connectivity",
    "public_transport_score",
    "transport_accessibility",

    "hotel_availability",
    "restaurant_availability",
    "tourist_facility_score",

    "attraction_density",
    "population_density",
    "urbanization_level",
    "night_activity_level",
    "traffic_accident_density",

    "distance_to_nearest_hospital_km",
    "distance_to_nearest_police_station_km",
    "distance_to_nearest_fire_station_km",
    "distance_to_nearest_railway_station_km",
    "distance_to_nearest_airport_km",
    "distance_to_major_road_km",

    "tourist_density"
]

TARGET = "tourist_friendly_score"


# ============================================================
# 3. CHECK FEATURES
# ============================================================

print("\nChecking features...")

missing_features = [
    col for col in features
    if col not in df.columns
]

if missing_features:
    print("Missing columns:")
    for col in missing_features:
        print(" -", col)

    raise ValueError("Some required feature columns are missing.")


# ============================================================
# 4. PREPARE X AND Y
# ============================================================

X = df[features].copy()
y = df[TARGET].copy()

print(f"\nNumber of features: {len(features)}")
print(f"X shape: {X.shape}")
print(f"Y shape: {y.shape}")


# ============================================================
# 5. HANDLE MISSING VALUES
# ============================================================

print("\nHandling missing values...")

X = X.replace([np.inf, -np.inf], np.nan)

for column in X.columns:
    if X[column].isna().any():
        X[column] = X[column].fillna(X[column].median())

print("Missing values handled.")


# ============================================================
# 6. TRAIN / TEST SPLIT
# ============================================================

print("\nSplitting dataset...")

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42
)

print(f"Training rows: {len(X_train):,}")
print(f"Testing rows:  {len(X_test):,}")


# ============================================================
# 7. TRAIN RANDOM FOREST
# ============================================================

print("\nTraining Random Forest...")

model = RandomForestRegressor(
    n_estimators=150,
    max_depth=20,
    min_samples_split=5,
    min_samples_leaf=2,
    random_state=42,
    n_jobs=-1
)

model.fit(X_train, y_train)

print("Training completed.")


# ============================================================
# 8. PREDICTIONS
# ============================================================

print("\nGenerating predictions...")

predictions = model.predict(X_test)


# ============================================================
# 9. EVALUATION
# ============================================================

mae = mean_absolute_error(y_test, predictions)
rmse = np.sqrt(mean_squared_error(y_test, predictions))
r2 = r2_score(y_test, predictions)

print("\n" + "=" * 50)
print("MODEL PERFORMANCE")
print("=" * 50)

print(f"MAE  : {mae:.4f}")
print(f"RMSE : {rmse:.4f}")
print(f"R²   : {r2:.4f}")

print("=" * 50)


# ============================================================
# 10. FEATURE IMPORTANCE
# ============================================================

importance = pd.DataFrame({
    "feature": features,
    "importance": model.feature_importances_
})

importance = importance.sort_values(
    "importance",
    ascending=False
)

print("\nTOP 15 IMPORTANT FEATURES")
print("=" * 50)

print(
    importance.head(15).to_string(index=False)
)


# ============================================================
# 11. SAVE MODEL
# ============================================================

MODEL_PATH = "models/tourist_safety_random_forest.pkl"

joblib.dump(
    {
        "model": model,
        "features": features
    },
    MODEL_PATH
)

print("\nModel saved successfully:")
print(MODEL_PATH)