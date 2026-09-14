# AtithiBandhu — Smart Tourist Safety System

AtithiBandhu is an AI-powered tourist safety system designed to help travellers understand the safety conditions of the areas around them.

The system uses the tourist's current GPS location, locality-level safety data, machine learning, and an interactive map to provide a **Tourist Safety Score (0–100)** for individual areas.

Unlike a district-level rating system, AtithiBandhu evaluates **individual localities**, allowing nearby areas to have different safety scores.

---

## 🚀 Key Features

### 📍 Live Location Tracking

The Tourist Dashboard uses the browser's Geolocation API to obtain the user's current latitude and longitude.

When live tracking is enabled, the location is continuously updated and used for safety analysis.

### 🤖 AI-Based Safety Prediction

The machine learning model evaluates locality-level safety using multiple factors:

- Crime Risk
- Accident Risk
- Road Condition
- Sanitation & Hygiene
- Public Reviews
- Emergency Access
- Environment
- Infrastructure
- Tourist Facilities

The model generates a safety score between **0 and 100**.

### 🗺️ Interactive Safety Map

The system displays nearby safety areas on an interactive Leaflet map.

Areas are represented using translucent colour-coded regions:

- 🟢 Safe
- 🟡 Moderate
- 🟠 Risky
- 🔴 High Risk

The safety score is displayed when the user hovers over an area instead of permanently displaying scores on the map.

### 📌 Locality-Level Analysis

AtithiBandhu does not assign the same score to an entire district.

For example:

```text
Khordha District

KIIT Square          → 56.53
Damana               → 61.69
Patia                → 54.75
Infocity             → 74.72
Sailashree Vihar     → 79.83
````

Each locality can therefore have its own safety assessment.

### 📏 20 KM Nearby Area Detection

The system searches for safety-rated localities within a **20 km radius** of the tourist's current location.

The map uses geospatial processing to prevent safety regions from overlapping and producing multiple ratings for the same location.

---

# 🧠 Machine Learning

The AI model was developed using Python and Scikit-learn.

Several algorithms were tested:

* Linear Regression
* Random Forest
* Gradient Boosting
* Extra Trees

The models were evaluated using:

* MAE
* RMSE
* R²
* Cross-validation

The current prototype selects **Linear Regression** based on the model evaluation.

The trained model is saved as:

```text
models/tourist_safety_model.pkl
```

The feature list is saved as:

```text
models/features.pkl
```

Model evaluation results are saved as:

```text
models/model_metrics.csv
```

---

# 📊 Dataset

The current prototype contains **4393 locality-level records** with geographical coordinates.

Important fields include:

```text
area_id
state_ut
district
locality
region_category
latitude
longitude
crime_risk_index
accident_risk_index
road_condition_score
sanitation_hygiene_score
public_review_score
emergency_access_score
environment_score
infrastructure_score
tourist_facilities_score
tourist_safety_score
tourist_friendliness_score
```

The latitude and longitude values allow the AI service to connect safety information with the tourist's physical location.

> The current dataset is intended for prototype and hackathon demonstration. It should not be treated as an official or authoritative safety database.

---

# ⚙️ System Architecture

```text
                Tourist
                   │
                   ▼
          React Tourist Dashboard
                   │
                   ▼
          Browser GPS Location
                   │
                   ▼
            Latitude / Longitude
                   │
                   ▼
          FastAPI AI Service
                   │
          ┌────────┴────────┐
          ▼                 ▼
  Locality Detection    Nearby Areas
          │               (20 KM)
          └────────┬────────┘
                   ▼
          Machine Learning Model
                   │
                   ▼
          Tourist Safety Score
                   │
                   ▼
        Geospatial Processing
                   │
                   ▼
       Non-overlapping Map Zones
                   │
                   ▼
          Interactive Safety Map
```

---

# 🔌 AI API

The machine learning model is exposed through a FastAPI service.

Start the API with:

```bash
uvicorn api:app --reload
```

The service runs at:

```text
http://127.0.0.1:8000
```

FastAPI documentation:

```text
http://127.0.0.1:8000/docs
```

## API Endpoints

### `GET /`

Checks whether the AI service is running.

Example:

```json
{
  "status": "online",
  "service": "AtithiBandhu Tourist Safety AI",
  "search_radius_km": 20
}
```

### `POST /predict-location`

Finds the locality associated with the supplied coordinates and returns its safety information.

Request:

```json
{
  "latitude": 20.3553,
  "longitude": 85.8163
}
```

Example result:

```text
Nearest locality: KIIT Square
District: Khordha
State: Odisha
Safety Score: 56.53
Risk Level: MODERATE
```

### `POST /nearby-areas`

Returns safety-rated localities within 20 km of the supplied location.

Request:

```json
{
  "latitude": 20.3553,
  "longitude": 85.8163
}
```

---

# 🛠️ Technology Stack

## Frontend

* React.js
* React Router
* React Leaflet
* Leaflet
* Turf.js
* CSS

## AI / Machine Learning

* Python
* Pandas
* NumPy
* Scikit-learn
* Joblib

## AI API

* FastAPI
* Uvicorn
* Pydantic

## Maps

* Leaflet
* React Leaflet
* OpenStreetMap
* Turf.js

## Backend

* Node.js
* Express.js
* MongoDB
* Socket.IO

---

# 📁 Project Structure

```text
atithibandhu/
│
├── tourist_ai_model/
│   │
│   ├── data/
│   │   └── india_tourist_*.csv
│   │
│   ├── models/
│   │   ├── tourist_safety_model.pkl
│   │   ├── features.pkl
│   │   └── model_metrics.csv
│   │
│   ├── src/
│   │   ├── explore.py
│   │   ├── train.py
│   │   ├── analyze_model.py
│   │   ├── predict.py
│   │   └── location_predict.py
│   │
│   └── api.py
│
├── frontend/
│   └── src/
│       ├── components/
│       │   └── MapView.jsx
│       │
│       ├── pages/
│       │   └── TouristDashboard.jsx
│       │
│       ├── services/
│       │   └── api.js
│       │
│       └── App.jsx
│
└── backend/
    └── ...
```

---

# ▶️ Running the Project

## 1. Start the AI Model

Open a terminal inside `tourist_ai_model`.

Activate the virtual environment:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install pandas numpy scikit-learn matplotlib seaborn joblib fastapi uvicorn pydantic
```

Train the model:

```bash
python src/train.py
```

Run the FastAPI service:

```bash
uvicorn api:app --reload
```

---

## 2. Start the Frontend

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm start
```

The frontend will normally be available at:

```text
http://localhost:3000
```

Allow location permission when prompted by the browser.

---

# 🔄 Application Flow

User opens AtithiBandhu
          ↓
User logs in
          ↓
User enables live location
          ↓
Browser obtains GPS coordinates
          ↓
Coordinates sent to AI API
          ↓
System identifies nearby localities
          ↓
AI model evaluates safety
          ↓
Safety scores generated
          ↓
Areas within 20 KM selected
          ↓
Safety zones generated
          ↓
Zones displayed on map
          ↓
User hovers over a zone
          ↓
Safety score + risk level displayed


# 🎯 Current Prototype

The current version focuses on:

* Locality-level safety prediction
* GPS-based location detection
* 20 km nearby-area analysis
* AI-generated safety scores
* Risk classification
* Interactive safety map
* Non-overlapping safety regions
* Hover-based score display
* React and FastAPI integration

# 🔮 Future Scope

The prototype can be further improved using:

* Larger verified locality datasets
* Continuously updated crime data
* Real accident data
* Verified road-condition information
* Live environmental data
* More comprehensive public-review data
* Improved machine learning models
* Mobile application support


# ⚠️ Disclaimer

AtithiBandhu is currently a **prototype developed for research and hackathon purposes**.

The safety scores generated by the current system are not official government safety ratings and should not be considered a guarantee of personal safety.

A real-world deployment would require verified, authoritative, and continuously updated data.