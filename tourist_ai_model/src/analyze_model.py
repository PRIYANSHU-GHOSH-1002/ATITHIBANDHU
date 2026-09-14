import pandas as pd
import joblib

MODEL_PATH = "models/tourist_safety_model.pkl"

FEATURES_PATH = "models/features.pkl"

model = joblib.load(MODEL_PATH)
features = joblib.load(FEATURES_PATH)


print("\n==============================")
print("MODEL FEATURE IMPORTANCE")
print("==============================\n")


# Linear Regression
if hasattr(model, "coef_"):

    importance = pd.DataFrame({
        "feature": features,
        "coefficient": model.coef_
    })

    importance["absolute_impact"] = (
        importance["coefficient"].abs()
    )

    importance = importance.sort_values(
        "absolute_impact",
        ascending=False
    )

    print(importance.to_string(index=False))


# Tree based models
elif hasattr(model, "feature_importances_"):

    importance = pd.DataFrame({
        "feature": features,
        "importance": model.feature_importances_
    })

    importance = importance.sort_values(
        "importance",
        ascending=False
    )

    print(importance.to_string(index=False))


else:

    print("Feature importance is not available.")