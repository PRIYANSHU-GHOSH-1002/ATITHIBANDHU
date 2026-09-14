
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from src.location_predict import (
    predict_location,
    predict_nearby_locations
)


# =========================================================
# FASTAPI APPLICATION
# =========================================================

app = FastAPI(
    title="AtithiBandhu Tourist Safety AI",
    description=(
        "AI-powered locality-level "
        "tourist safety prediction API"
    ),
    version="1.0.0"
)


# =========================================================
# CORS
# =========================================================
#
# Development configuration.
#
# This allows your React frontend running on localhost
# to communicate with this FastAPI server.
#
# Later, when the project is deployed, we should replace
# this with your actual frontend domain.
#
# =========================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",

        # In case Vite uses another common development port
        "http://localhost:5174",
        "http://127.0.0.1:5174",

        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# =========================================================
# REQUEST MODEL
# =========================================================

class LocationRequest(BaseModel):

    latitude: float

    longitude: float


# =========================================================
# ROOT / HEALTH CHECK
# =========================================================

@app.get("/")
def root():

    return {

        "status": "online",

        "service":
            "AtithiBandhu Tourist Safety AI",

        "search_radius_km":
            20

    }


# =========================================================
# NEAREST LOCATION
# =========================================================

@app.post("/predict-location")
def predict(location: LocationRequest):

    try:

        result = predict_location(
            location.latitude,
            location.longitude
        )

        return result

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# =========================================================
# ALL AREAS WITHIN 20 KM
# =========================================================

@app.post("/nearby-areas")
def nearby_areas(
    location: LocationRequest
):

    try:

        results = predict_nearby_locations(
            location.latitude,
            location.longitude,
            radius_km=20
        )


        return {

            "user_location": {

                "latitude":
                    location.latitude,

                "longitude":
                    location.longitude

            },

            "radius_km":
                20,

            "total_areas":
                len(results),

            "areas":
                results

        }


    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

