import pandas as pd
import numpy as np
import joblib
import os

from sklearn.model_selection import train_test_split, cross_val_score

from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.ensemble import ExtraTreesRegressor

from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score
)


# ==========================================
# CONFIGURATION
# ==========================================

DATA_PATH = "data/india_tourist_safety_200000.csv"

MODEL_DIR = "models"

RANDOM_STATE = 42


# ==========================================
# LOAD DATA
# ==========================================

print("\nLoading dataset...")

df = pd.read_csv(DATA_PATH)

print("Dataset size:", df.shape)


# ==========================================
# FEATURES
# ==========================================

features = [
    "crime_risk_index",
    "accident_risk_index",
    "road_condition_score",
    "sanitation_hygiene_score",
    "public_review_score",
    "emergency_access_score",
    "environment_score",
    "infrastructure_score",
    "tourist_facilities_score"
]

target = "tourist_safety_score"


X = df[features]

y = df[target]


# ==========================================
# DATA VALIDATION
# ==========================================

print("\nChecking data...")

print("Missing values:")
print(X.isnull().sum())

print("\nTarget range:")
print(y.min(), "→", y.max())


# ==========================================
# TRAIN TEST SPLIT
# ==========================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=RANDOM_STATE
)


print("\nTraining samples:", len(X_train))
print("Testing samples:", len(X_test))


# ==========================================
# MODELS
# ==========================================

models = {

    "Linear Regression":
        LinearRegression(),

    "Random Forest":
        RandomForestRegressor(
            n_estimators=300,
            random_state=RANDOM_STATE,
            n_jobs=-1
        ),

    "Gradient Boosting":
        GradientBoostingRegressor(
            n_estimators=200,
            random_state=RANDOM_STATE
        ),

    "Extra Trees":
        ExtraTreesRegressor(
            n_estimators=300,
            random_state=RANDOM_STATE,
            n_jobs=-1
        )
}


# ==========================================
# TRAINING
# ==========================================

results = []


for name, model in models.items():

    print("\n================================")
    print("Training:", name)
    print("================================")

    # Train
    model.fit(X_train, y_train)

    # Test predictions
    predictions = model.predict(X_test)

    predictions = np.clip(
        predictions,
        0,
        100
    )

    # Metrics
    mae = mean_absolute_error(
        y_test,
        predictions
    )

    rmse = np.sqrt(
        mean_squared_error(
            y_test,
            predictions
        )
    )

    r2 = r2_score(
        y_test,
        predictions
    )

    # Cross validation
    cv_scores = cross_val_score(
        model,
        X,
        y,
        cv=5,
        scoring="r2",
        n_jobs=-1
    )

    cv_mean = cv_scores.mean()

    cv_std = cv_scores.std()


    results.append({

        "Model": name,

        "MAE": mae,

        "RMSE": rmse,

        "R2": r2,

        "CV_R2_Mean": cv_mean,

        "CV_R2_STD": cv_std

    })


# ==========================================
# RESULTS
# ==========================================

results_df = pd.DataFrame(results)


print("\n\n")
print("==========================================")
print("             MODEL COMPARISON")
print("==========================================")

print(
    results_df.to_string(
        index=False
    )
)


# ==========================================
# SELECT BEST MODEL
# ==========================================

best_index = results_df[
    "RMSE"
].idxmin()


best_model_name = results_df.loc[
    best_index,
    "Model"
]


best_model = models[
    best_model_name
]


print("\n==========================================")
print("BEST MODEL")
print("==========================================")

print(best_model_name)


# ==========================================
# SAVE MODEL
# ==========================================

os.makedirs(
    MODEL_DIR,
    exist_ok=True
)


model_path = os.path.join(
    MODEL_DIR,
    "tourist_safety_model.pkl"
)


features_path = os.path.join(
    MODEL_DIR,
    "features.pkl"
)


metrics_path = os.path.join(
    MODEL_DIR,
    "model_metrics.csv"
)


joblib.dump(
    best_model,
    model_path
)


joblib.dump(
    features,
    features_path
)


results_df.to_csv(
    metrics_path,
    index=False
)


print("\nModel saved:")
print(model_path)

print("\nFeatures saved:")
print(features_path)

print("\nMetrics saved:")
print(metrics_path)