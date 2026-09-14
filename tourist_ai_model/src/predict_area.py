import pandas as pd
import joblib
import numpy as np


# ==========================================
# FILE PATHS
# ==========================================

DATA_PATH = "data/india_tourist_safety_5000_area_dataset.csv"

MODEL_PATH = "models/tourist_safety_model.pkl"

FEATURES_PATH = "models/features.pkl"


# ==========================================
# LOAD DATA
# ==========================================

df = pd.read_csv(DATA_PATH)

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
# FIND AREA
# ==========================================

area_name = input(
    "\nEnter locality/area name: "
).strip().lower()


matches = df[
    df["locality"]
    .str.lower()
    .str.contains(
        area_name,
        na=False
    )
]


# ==========================================
# CHECK RESULTS
# ==========================================

if len(matches) == 0:

    print("\n❌ Area not found in dataset.")

    exit()


print(
    f"\nFound {len(matches)} matching area(s).\n"
)


# ==========================================
# PREDICT EACH MATCH
# ==========================================

for index, row in matches.iterrows():

    input_data = pd.DataFrame(
        [[row[feature] for feature in features]],
        columns=features
    )


    prediction = model.predict(
        input_data
    )[0]


    prediction = float(
        np.clip(
            prediction,
            0,
            100
        )
    )


    risk = classify_risk(
        prediction
    )


    print("====================================")

    print(
        "Area:",
        row["locality"]
    )

    print(
        "District:",
        row["district"]
    )

    print(
        "State:",
        row["state_ut"]
    )

    print(
        "Safety Score:",
        round(prediction, 2)
    )

    print(
        "Risk Level:",
        risk
    )

    print("====================================")