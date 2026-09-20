import pandas as pd
import numpy as np
from pathlib import Path


# ==========================================
# PATHS
# ==========================================

BASE_DIR = Path(__file__).resolve().parent.parent

RUNTIME_DATA_PATH = (
    BASE_DIR
    / "data"
    / "runtime_locations.csv"
)


# ==========================================
# LOAD RUNTIME DATA
# ==========================================

print("Loading runtime location data...")

df = pd.read_csv(
    RUNTIME_DATA_PATH,
    low_memory=False
)

print(
    "Runtime dataset loaded:",
    len(df),
    "locations"
)


# ==========================================
# PREPARE COORDINATES
# ==========================================

LATITUDES = df["latitude"].to_numpy()
LONGITUDES = df["longitude"].to_numpy()


# ==========================================
# HAVERSINE DISTANCE
# ==========================================

def haversine_distance(
    lat1,
    lon1,
    lat2,
    lon2
):

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
# PREDICT NEARBY LOCATIONS
# ==========================================

def predict_nearby_locations(
    user_latitude,
    user_longitude,
    radius_km=20
):

    distances = haversine_distance(
        user_latitude,
        user_longitude,
        LATITUDES,
        LONGITUDES
    )

    nearby_indices = np.where(
        distances <= radius_km
    )[0]

    if len(nearby_indices) == 0:
        return []

    results = []

    for index in nearby_indices:

        location = df.iloc[index]

        def safe_string(value):

            if pd.isna(value):
                return None

            return str(value)

        results.append({

            "location_id":
                safe_string(location["location_id"]),

            "location_name":
                safe_string(location["location_name"]),

            "street_name":
                safe_string(location["street_name"]),

            "locality":
                safe_string(location["locality"]),

            "sub_locality":
                safe_string(location["sub_locality"]),

            "city":
                safe_string(location["city"]),

            "district":
                safe_string(location["district"]),

            "state":
                safe_string(location["state"]),

            "pincode":
                safe_string(location["pincode"]),

            "location_type":
                safe_string(location["location_type"]),

            "tourist_destination":
                safe_string(location["tourist_destination"]),

            "latitude":
                float(location["latitude"]),

            "longitude":
                float(location["longitude"]),

            "distance_km":
                round(
                    float(distances[index]),
                    3
                ),

            "safety_score":
                round(
                    float(
                        location[
                            "predicted_safety_score"
                        ]
                    ),
                    2
                ),

            "risk_level":
                safe_string(
                    location[
                        "predicted_risk_level"
                    ]
                )

        })

    results.sort(
        key=lambda x: x["distance_km"]
    )

    return results


# ==========================================
# SINGLE LOCATION
# ==========================================

def predict_location(
    user_latitude,
    user_longitude
):

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
    print(" ATITHIBANDHU DEPLOYMENT LOCATION AI")
    print("======================================")

    user_latitude = 20.3553
    user_longitude = 85.8163

    radius = 20

    results = predict_nearby_locations(
        user_latitude,
        user_longitude,
        radius
    )

    print(
        "\nUser location:",
        user_latitude,
        user_longitude
    )

    print(
        "Search radius:",
        radius,
        "km"
    )

    print(
        "Areas found:",
        len(results)
    )

    print("\n--------------------------------------")

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