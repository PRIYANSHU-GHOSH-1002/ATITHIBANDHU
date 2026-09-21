import { useEffect, useRef, useState } from "react";
import api from "../services/api";
import { getSocket } from "../services/socket";
import MapView from "../components/MapView";
import SOSButton from "../components/SOSButton";
import { getNearbySafetyAreas } from "../services/aiService";
import { useAuth } from "../context/AuthContext";

// ==========================================
// ATITHIBANDHU TOURIST DASHBOARD
// ==========================================
// Features:
// 1. Live GPS tracking
// 2. Socket.IO location updates
// 3. Existing geofence alerts
// 4. SOS
// 5. AI-powered locality safety assessment
// 6. 20 km nearby safety-area search
// ==========================================

export default function TouristDashboard() {
  const { user, logout } = useAuth();

  // ========================================
  // STATE
  // ========================================

  const [position, setPosition] = useState(null);
  const [zones, setZones] = useState([]);
  const [alert, setAlert] = useState(null);

  const [aiSafety, setAiSafety] = useState(null);
  const [nearbyAreas, setNearbyAreas] = useState([]);

  const [tracking, setTracking] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const watchIdRef = useRef(null);

  // ========================================
  // LOAD EXISTING GEOFENCE + SOCKET
  // ========================================

  useEffect(() => {
    api
      .get("/geofence")
      .then((res) => setZones(res.data))
      .catch(() => {});

    const socket = getSocket();

    // Existing geofence alert
    socket.on("geofence:alert", (data) => {
      setAlert(data);

      setTimeout(() => {
        setAlert(null);
      }, 8000);
    });

    // Existing backend AI safety update
    socket.on("ai:safetyUpdate", (data) => {
      setAiSafety(data);
    });

    // Cleanup
    return () => {
      socket.off("geofence:alert");
      socket.off("ai:safetyUpdate");
    };
  }, []);

  // ========================================
  // CALL ATITHIBANDHU ML API
  // ========================================

  async function fetchAISafety(latitude, longitude) {
    try {
      setAiLoading(true);

      const data = await getNearbySafetyAreas(
        latitude,
        longitude
      );

      // Store all localities within 20 km
      setNearbyAreas(data.areas || []);

      // Find the closest locality
      if (data.areas && data.areas.length > 0) {
        const nearest = data.areas[0];

        setAiSafety({
          status: nearest.risk_level,
          riskScore: nearest.safety_score,
          locality: nearest.locality,
          district: nearest.district,
          message: `${nearest.locality} has a tourist safety score of ${nearest.safety_score}.`,
        });
      } else {
        setAiSafety(null);
      }
    } catch (error) {
      console.error("AI Safety Error:", error);
    } finally {
      setAiLoading(false);
    }
  }

  // ========================================
  // START LIVE TRACKING
  // ========================================

  function startTracking() {
    if (!navigator.geolocation) {
      setLocationError(
        "Geolocation is not supported by this browser."
      );
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const {
          latitude,
          longitude,
          accuracy,
          speed,
        } = pos.coords;

        const point = {
          lat: latitude,
          lng: longitude,
        };

        // Update user position
        setPosition(point);
        setLocationError("");

        // Send location to Socket.IO
        getSocket().emit("location:update", {
          lat: latitude,
          lng: longitude,
          accuracy,
          speed,
        });

        // Ask AI for nearby safety areas
        fetchAISafety(latitude, longitude);
      },
      (err) => {
        setLocationError(err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      }
    );

    watchIdRef.current = id;
    setTracking(true);
  }

  // ========================================
  // STOP LIVE TRACKING
  // ========================================

  function stopTracking() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(
        watchIdRef.current
      );

      watchIdRef.current = null;
    }

    setTracking(false);
  }

  // ========================================
  // CLEANUP GPS
  // ========================================

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(
          watchIdRef.current
        );
      }
    };
  }, []);

  // ========================================
  // CONVERT AI RESULTS TO MAP MARKERS
  // ========================================

  const safetyMarkers = nearbyAreas.map((area) => ({
    id: `ai-${area.location_id}`,
    areaId: area.location_id,

    lat: area.latitude,
    lng: area.longitude,

    label: `${area.locality} — ${area.safety_score}`,

    safetyScore: area.safety_score,
    riskLevel: area.risk_level,
    distance: area.distance_km,
  }));

  // ========================================
  // MAP MARKERS
  // ========================================

  const allMarkers = [
    // User marker
    ...(position
      ? [
          {
            id: "me",
            lat: position.lat,
            lng: position.lng,
            label: "You are here",
          },
        ]
      : []),

    // AI locality markers
    ...safetyMarkers,
  ];

  // ========================================
  // HELPER FOR RISK BADGE CLASS
  // ========================================

  function getRiskBadgeClass(level) {
    if (!level) {
      return "risk-badge risk-badge-unknown";
    }

    const l = String(level).toLowerCase();

    if (
      l.includes("safe") ||
      l.includes("low") ||
      l.includes("friendly")
    ) {
      return "risk-badge risk-badge-safe";
    }

    if (
      l.includes("moderate") ||
      l.includes("medium")
    ) {
      return "risk-badge risk-badge-moderate";
    }

    if (
      l.includes("high") ||
      l.includes("unsafe") ||
      l.includes("severe") ||
      l.includes("danger")
    ) {
      return "risk-badge risk-badge-danger";
    }

    return "risk-badge risk-badge-unknown";
  }

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="dashboard">

      {/* ==================================
          TOP BAR
      ================================== */}

      <div className="top-bar">
        <div className="brand-mark">
          <span className="beacon-dot" />

          <div className="brand-copy">
            <span className="brand-wordmark">
              <span className="accent">Atithi</span>
              Bandhu
            </span>

            <span className="brand-tagline">
              Savdhan Rahe, Satark Rahe
            </span>
          </div>
        </div>

        {tracking && (
          <span className="live-pill">
            <span className="pulse-dot" />
            Live
          </span>
        )}
      </div>

      {/* ==================================
          HEADER
      ================================== */}

      <div className="dashboard-header">
        <div>
          <h2>Welcome, {user?.name}</h2>

          <p className="digital-id">
            Digital ID hash:{" "}
            <span className="value">
              {user?.digitalId?.hash?.slice(0, 16)}...
            </span>
          </p>
        </div>

        <button
          onClick={logout}
          className="secondary"
        >
          Logout
        </button>
      </div>

      {/* ==================================
          GEOFENCE ALERT
      ================================== */}

      {alert && (
        <div
          className={`banner banner-${alert.type}`}
        >
          {alert.message}
        </div>
      )}

      {/* ==================================
          LOCATION ERROR
      ================================== */}

      {locationError && (
        <div className="banner banner-danger">
          {locationError}
        </div>
      )}

      {/* ==================================
          AI SAFETY STATUS
      ================================== */}

      {aiSafety && (
        <div className="ai-safety-card">
          <div className="ai-safety-card-header">
            <span className="ai-safety-eyebrow">
              AI Safety Assessment

              {aiLoading && (
                <span className="ai-safety-updating">
                  {" "}
                  · Updating...
                </span>
              )}
            </span>

            <span
              className={getRiskBadgeClass(
                aiSafety.status
              )}
            >
              {aiSafety.status || "Unknown"}
            </span>
          </div>

          <div className="ai-safety-card-body">
            <div>
              <div className="ai-safety-locality">
                {aiSafety.locality || "Current area"}

                {aiSafety.district && (
                  <span className="ai-safety-district">
                    {" "}
                    · {aiSafety.district}
                  </span>
                )}
              </div>
            </div>

            <div className="ai-safety-score">
              <span className="ai-safety-score-value">
                {typeof aiSafety.riskScore ===
                "number"
                  ? aiSafety.riskScore.toFixed(1)
                  : "—"}
              </span>

              <span className="ai-safety-score-label">
                / 100
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ==================================
          TRACKING CONTROLS
      ================================== */}

      <div className="tracking-controls">
        {!tracking ? (
          <button onClick={startTracking}>
            Start Live Location Sharing
          </button>
        ) : (
          <button
            className="secondary"
            onClick={stopTracking}
          >
            Stop Sharing
          </button>
        )}

        <SOSButton position={position} />
      </div>

      {/* ==================================
          MAP
      ================================== */}

      <MapView
        center={
          position
            ? [position.lat, position.lng]
            : [20.5937, 78.9629]
        }
        zoom={position ? 13 : 5}
        zones={zones}
        markers={allMarkers}
        label="AtithiBandhu Tourist Safety Map"
        height="530px"
      />

      {/* ==================================
          SAFETY SUMMARY (20 km radius)
      ================================== */}

      {nearbyAreas.length > 0 && (
        <div className="ai-summary">
          <div className="ai-summary-header">
            <h3>
              Tourist Safety — 20 km Radius
            </h3>

            <span className="ai-summary-count">
              {nearbyAreas.length} areas detected
            </span>
          </div>

          <div className="safety-list">
            {nearbyAreas
              .slice(0, 10)
              .map((area) => (
                <div
                  key={area.location_id}
                  className="safety-item"
                >
                  <div className="safety-item-main">
                    <strong>
                      {area.locality}
                    </strong>

                    <span className="safety-item-distance">
                      {area.distance_km?.toFixed?.(1) ??
                        area.distance_km}{" "}
                      km away
                    </span>
                  </div>

                  <div className="safety-item-meta">
                    <span className="safety-item-score">
                      {area.safety_score}/100
                    </span>

                    <span
                      className={
                        getRiskBadgeClass(
                          area.risk_level
                        ) +
                        " risk-badge-sm"
                      }
                    >
                      {area.risk_level}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ==================================
          COORDINATES
      ================================== */}

      {position && (
        <p className="coords">
          Lat {position.lat.toFixed(5)} · Lng{" "}
          {position.lng.toFixed(5)}
        </p>
      )}

      {/* ==================================
          FOOTER
      ================================== */}

      <footer className="app-footer">
        made with{" "}
        <span className="app-footer-heart">
          ❤️
        </span>{" "}
        | <strong>PRIYANSHU</strong>
      </footer>
    </div>
  );
}