import pandas as pd
import numpy as np
import joblib
from pathlib import Path


# ==========================================
# PATHS
# ==========================================

BASE_DIR = Path(__file__).resolve().parent.parent

DATA_PATH = (
    BASE_DIR
    / "data"
    / "india_tourist_safety_200000.csv"
)

MODEL_PATH = (
    BASE_DIR
    / "models"
    / "tourist_safety_random_forest.pkl"
)


# ==========================================
# LOAD DATA AND MODEL
# ==========================================

print("Loading tourist safety dataset...")

df = pd.read_csv(
    DATA_PATH,
    low_memory=False
)

print("Dataset loaded:", len(df), "locations")


print("Loading trained Random Forest model...")

model_data = joblib.load(MODEL_PATH)

model = model_data["model"]
features = model_data["features"]

print("Model loaded successfully")
print("Number of features:", len(features))


# ==========================================
# PREPARE MODEL DATA
# ==========================================

# Get only the columns required by the model
model_input = df[features].copy()


# Fill missing values with median
# This is the same preprocessing used during training
for column in features:

    if model_input[column].isnull().any():

        model_input[column] = model_input[column].fillna(
            model_input[column].median()
        )


# ==========================================
# PREDICT SAFETY SCORES
# ==========================================

print("Calculating safety scores for all locations...")

predictions = model.predict(model_input)


# Keep scores between 0 and 100
predictions = np.clip(
    predictions,
    0,
    100
)


# Store predictions in dataframe
df["predicted_safety_score"] = predictions


# ==========================================
# RISK CLASSIFICATION
# ==========================================

def classify_risk(score):

    if score >= 70:
        return "SAFE"

    elif score >= 55:
        return "MODERATE"

    elif score >= 40:
        return "RISKY"

    else:
        return "HIGH RISK"


# Calculate risk level for every location
df["predicted_risk_level"] = (
    df["predicted_safety_score"]
    .apply(classify_risk)
)


print("Safety scores calculated successfully")


# ==========================================
# HAVERSINE DISTANCE
# ==========================================

def haversine_distance(
    lat1,
    lon1,
    lat2,
    lon2
):

    """
    Calculate distance between geographic
    coordinates.

    Returns distance in kilometers.
    """

    R = 6371.0

    lat1 = np.radians(lat1)
    lon1 = np.radians(lon1)

    lat2 = np.radians(lat2)
    lon2 = np.radians(lon2)

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = (
        np.sin(dlat / 2) ** 2
        +
        np.cos(lat1)
        * np.cos(lat2)
        * np.sin(dlon / 2) ** 2
    )

    c = 2 * np.arctan2(
        np.sqrt(a),
        np.sqrt(1 - a)
    )

    return R * c


# ==========================================
# PREDICT MULTIPLE NEARBY LOCATIONS
# ==========================================

def predict_nearby_locations(
    user_latitude,
    user_longitude,
    radius_km=20
):

    """
    Find all locations within the specified
    radius and return their individual
    tourist safety scores.
    """

    # --------------------------------------
    # Calculate distance to every location
    # --------------------------------------

    distances = haversine_distance(
        user_latitude,
        user_longitude,
        df["latitude"].values,
        df["longitude"].values
    )


    # --------------------------------------
    # Find locations inside radius
    # --------------------------------------

    nearby_mask = distances <= radius_km

    nearby_indices = np.where(
        nearby_mask
    )[0]


    # --------------------------------------
    # No locations found
    # --------------------------------------

    if len(nearby_indices) == 0:

        return []


    results = []


    # --------------------------------------
    # Get information for every nearby area
    # --------------------------------------

    for index in nearby_indices:

        location = df.iloc[index]


        # Safety score was already predicted
        # for the entire dataset above
        prediction = float(
            location["predicted_safety_score"]
        )


        risk = location[
            "predicted_risk_level"
        ]


        # ----------------------------------
        # Helper function for missing values
        # ----------------------------------

        def safe_string(value):

            if pd.isna(value):
                return None

            return str(value)


        # ----------------------------------
        # Build result
        # ----------------------------------

        results.append({

            "location_id":
                safe_string(
                    location["location_id"]
                ),

            "location_name":
                safe_string(
                    location["location_name"]
                ),

            "street_name":
                safe_string(
                    location["street_name"]
                ),

            "locality":
                safe_string(
                    location["locality"]
                ),

            "sub_locality":
                safe_string(
                    location["sub_locality"]
                ),

            "city":
                safe_string(
                    location["city"]
                ),

            "district":
                safe_string(
                    location["district"]
                ),

            "state":
                safe_string(
                    location["state"]
                ),

            "pincode":
                safe_string(
                    location["pincode"]
                ),

            "location_type":
                safe_string(
                    location["location_type"]
                ),

            "tourist_destination":
                safe_string(
                    location["tourist_destination"]
                ),

            "latitude":
                float(
                    location["latitude"]
                ),

            "longitude":
                float(
                    location["longitude"]
                ),

            "distance_km":
                round(
                    float(distances[index]),
                    3
                ),

            "safety_score":
                round(
                    prediction,
                    2
                ),

            "risk_level":
                risk

        })


    # --------------------------------------
    # Sort by distance
    # --------------------------------------

    results.sort(
        key=lambda x: x["distance_km"]
    )


    return results


# ==========================================
# SINGLE LOCATION FUNCTION
# ==========================================

def predict_location(
    user_latitude,
    user_longitude
):

    """
    Return the nearest locality
    within 20 km.
    """

    results = predict_nearby_locations(
        user_latitude,
        user_longitude,
        radius_km=20
    )


    if not results:

        raise ValueError(
            "No locality found within 20 km."
        )


    return results[0]


# ==========================================
# TEST
# ==========================================

if __name__ == "__main__":

    print("\n======================================")
    print("     ATITHIBANDHU LOCATION AI")
    print("======================================")


    # Test location
    user_latitude = 20.3553
    user_longitude = 85.8163


    # Search radius
    radius = 20


    # --------------------------------------
    # Find nearby locations
    # --------------------------------------

    results = predict_nearby_locations(
        user_latitude,
        user_longitude,
        radius
    )


    print("\nUser location:")

    print(
        user_latitude,
        user_longitude
    )


    print(
        "\nSearch radius:",
        radius,
        "km"
    )


    print(
        "Areas found:",
        len(results)
    )


    print("\n--------------------------------------")


    # --------------------------------------
    # Show first 20 nearby areas
    # --------------------------------------

    for i, result in enumerate(
        results[:20],
        start=1
    ):

        print(

            f"{i}. "

            f"{result['location_name']} | "

            f"{result['locality']} | "

            f"{result['distance_km']} km | "

            f"{result['safety_score']} | "

            f"{result['risk_level']}"

        )


    print("--------------------------------------")


    print(
        "\nTotal areas within 20 km:",
        len(results)
    )


    print("\n======================================")