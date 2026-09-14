
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  Circle,
  Tooltip,
  GeoJSON
} from "react-leaflet";

import L from "leaflet";
import * as turf from "@turf/turf";


// ============================================================
// FIX DEFAULT LEAFLET MARKER ICON
// ============================================================

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});


// ============================================================
// GEOFENCE COLORS
// ============================================================

const ZONE_COLORS = {
  safe: "#3DDC97",
  danger: "#FF5A5F",
  restricted: "#9B7EDE"
};


// ============================================================
// SAFETY COLOR
// ============================================================

function getSafetyColor(score) {

  if (score >= 80) {
    return "#16a34a";
  }

  if (score >= 60) {
    return "#eab308";
  }

  if (score >= 40) {
    return "#f97316";
  }

  return "#dc2626";
}


// ============================================================
// SAFETY LABEL
// ============================================================

function getSafetyLabel(score) {

  if (score >= 80) {
    return "SAFE";
  }

  if (score >= 60) {
    return "MODERATE";
  }

  if (score >= 40) {
    return "RISKY";
  }

  return "HIGH RISK";
}


// ============================================================
// USER LOCATION ICON
// ============================================================

const userIcon = L.divIcon({

  className: "user-location-marker",

  html: `
    <div style="
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #2563eb;
      border: 4px solid white;
      box-shadow:
        0 0 0 6px rgba(37,99,235,0.25),
        0 2px 8px rgba(0,0,0,0.35);
    "></div>
  `,

  iconSize: [22, 22],

  iconAnchor: [11, 11],

  popupAnchor: [0, -11]
});


// ============================================================
// CREATE NON-OVERLAPPING AI SAFETY ZONES
//
// Each locality becomes a Voronoi cell.
//
// Result:
//     One geographic point
//              ↓
//     One nearest locality
//              ↓
//     One safety score
//
// No overlapping safety regions.
// ============================================================

function createSafetyZones(aiAreas, center) {

  if (!aiAreas || aiAreas.length === 0) {
    return [];
  }


  // ----------------------------------------------------------
  // Remove invalid / duplicate coordinates
  // ----------------------------------------------------------

  const validAreas = [];

  const coordinateSet = new Set();

  aiAreas.forEach((area) => {

    const lat = Number(area.lat);
    const lng = Number(area.lng);
    const score = Number(area.safetyScore);

    if (!Number.isFinite(lat)) {
      return;
    }

    if (!Number.isFinite(lng)) {
      return;
    }

    if (!Number.isFinite(score)) {
      return;
    }

    const coordinateKey =
      `${lat.toFixed(6)},${lng.toFixed(6)}`;

    // Avoid duplicate points because Voronoi
    // cannot meaningfully divide identical coordinates.
    if (coordinateSet.has(coordinateKey)) {
      return;
    }

    coordinateSet.add(coordinateKey);

    validAreas.push({
      ...area,
      lat,
      lng,
      safetyScore: score
    });

  });


  if (validAreas.length === 0) {
    return [];
  }


  // ----------------------------------------------------------
  // If only one locality exists, use a 1 km circle.
  // ----------------------------------------------------------

  if (validAreas.length === 1) {

    const area = validAreas[0];

    const circle =
      turf.circle(
        [area.lng, area.lat],
        1,
        {
          units: "kilometers",
          steps: 64
        }
      );

    circle.properties = {
      ...area
    };

    return [circle];
  }


  // ----------------------------------------------------------
  // Create Turf points
  // ----------------------------------------------------------

  const points = turf.featureCollection(

    validAreas.map((area) => {

      return turf.point(

        [area.lng, area.lat],

        {
          area
        }

      );

    })

  );


  // ----------------------------------------------------------
  // Create the 20 KM analysis boundary
  // ----------------------------------------------------------

  const searchCircle = turf.circle(

    [center[1], center[0]],

    20,

    {
      units: "kilometers",
      steps: 96
    }

  );


  // ----------------------------------------------------------
  // Get bounding box of 20 KM circle
  // ----------------------------------------------------------

  const bbox = turf.bbox(searchCircle);


  // ----------------------------------------------------------
  // Generate Voronoi polygons
  // ----------------------------------------------------------

  let voronoi;

  try {

    voronoi = turf.voronoi(

      points,

      {
        bbox
      }

    );

  } catch (error) {

    console.error(
      "Voronoi generation failed:",
      error
    );

    return [];
  }


  if (!voronoi || !voronoi.features) {
    return [];
  }


  // ----------------------------------------------------------
  // Clip every Voronoi cell to the 20 KM boundary
  // ----------------------------------------------------------

  const clippedZones = [];


  voronoi.features.forEach((polygon, index) => {

    if (!polygon.geometry) {
      return;
    }


    let clipped = null;

    try {

      clipped =
        turf.intersect(

          turf.featureCollection([
            polygon,
            searchCircle
          ])

        );

    } catch (error) {

      console.error(
        "Zone clipping failed:",
        error
      );

      return;
    }


    if (!clipped) {
      return;
    }


    // Turf generally preserves the input ordering,
    // so associate this polygon with its locality.
    const area =
      validAreas[index];

    if (!area) {
      return;
    }


    clipped.properties = {

      areaId:
        area.areaId,

      label:
        area.label,

      lat:
        area.lat,

      lng:
        area.lng,

      safetyScore:
        area.safetyScore,

      distance:
        area.distance,

      safetyLabel:
        getSafetyLabel(
          area.safetyScore
        )

    };


    clippedZones.push(clipped);

  });


  return clippedZones;
}


// ============================================================
// MAIN MAP COMPONENT
// ============================================================

export default function MapView({

  center,

  zoom = 14,

  markers = [],

  zones = [],

  height = "420px",

  label = "AI Tourist Safety Map"

}) {


  // ==========================================================
  // USER MARKER
  // ==========================================================

  const userMarker =
    markers.find(
      (m) => m.id === "me"
    );


  // ==========================================================
  // AI LOCALITY POINTS
  // ==========================================================

  const aiAreas =
    markers.filter(
      (m) => m.id !== "me"
    );


  // ==========================================================
  // CREATE NON-OVERLAPPING SAFETY ZONES
  // ==========================================================

  const safetyZones =
    userMarker
      ? createSafetyZones(
          aiAreas,
          [
            userMarker.lat,
            userMarker.lng
          ]
        )
      : [];


  return (

    <div className="map-card">


      {/* ====================================================
          MAP HEADER
      ==================================================== */}

      <div className="map-card-label">

        <span

          className="dot dot-green"

          style={{

            width: 6,

            height: 6,

            borderRadius: "50%",

            display: "inline-block"

          }}

        />

        {label}

      </div>


      {/* ====================================================
          MAP
      ==================================================== */}

      <div

        style={{

          height,

          width: "100%"

        }}

      >

        <MapContainer

          center={center}

          zoom={zoom}

          style={{

            height: "100%",

            width: "100%"

          }}

        >


          {/* =================================================
              OPEN STREET MAP
          ================================================= */}

          <TileLayer

            attribution=
              '&copy; OpenStreetMap contributors'

            url=
              "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

          />


          {/* =================================================
              EXISTING GEOFENCE ZONES
          ================================================= */}

          {zones.map((zone) => (

            <Polygon

              key={zone._id}

              positions={zone.coordinates}

              pathOptions={{

                color:
                  ZONE_COLORS[
                    zone.type
                  ] || "#F2A93B",

                fillOpacity: 0.18,

                weight: 2

              }}

            >

              <Popup>

                <strong>
                  {zone.name}
                </strong>

                <br />

                Type:
                {" "}
                {zone.type}

                <br />

                Risk:
                {" "}
                {zone.riskLevel}

              </Popup>

            </Polygon>

          ))}


          {/* =================================================
              20 KM AI SEARCH BOUNDARY
          ================================================= */}

          {userMarker && (

            <Circle

              center={[

                userMarker.lat,

                userMarker.lng

              ]}

              radius={20000}

              pathOptions={{

                color: "#2563eb",

                fillColor: "#2563eb",

                fillOpacity: 0.025,

                weight: 1.5,

                dashArray: "8 8"

              }}

            >

              <Tooltip>

                AI analysis radius: 20 km

              </Tooltip>

            </Circle>

          )}


          {/* =================================================
              NON-OVERLAPPING AI SAFETY ZONES

              IMPORTANT:

              These are NOT overlapping 1 KM circles.

              They are Voronoi regions.

              Every location belongs to exactly
              ONE nearest locality.
          ================================================= */}

          {safetyZones.map(

            (zone) => {

              const score =
                Number(
                  zone.properties
                    ?.safetyScore
                );


              const color =
                getSafetyColor(score);


              const safetyLabel =
                zone.properties
                  ?.safetyLabel
                ||
                getSafetyLabel(score);


              return (

                <GeoJSON

                  key={
                    zone.properties
                      ?.areaId
                    ||
                    `${zone.properties?.lat}-${zone.properties?.lng}`
                  }

                  data={zone}

                  style={{

                    color,

                    fillColor: color,

                    fillOpacity: 0.32,

                    opacity: 0.75,

                    weight: 1.5

                  }}


                  eventHandlers={{

                    mouseover: (event) => {

                      event.target.setStyle({

                        fillOpacity: 0.48,

                        weight: 2.5

                      });

                    },

                    mouseout: (event) => {

                      event.target.setStyle({

                        fillOpacity: 0.32,

                        weight: 1.5

                      });

                    }

                  }}

                >

                  {/* ======================================
                      HOVER TOOLTIP
                  ====================================== */}

                  <Tooltip

                    sticky

                    direction="top"

                    opacity={0.95}

                  >

                    <div

                      style={{

                        textAlign:
                          "center",

                        minWidth:
                          "160px"

                      }}

                    >

                      <strong>

                        {
                          zone
                            .properties
                            ?.label
                            || "Unknown locality"
                        }

                      </strong>


                      <br />


                      <span>

                        Safety Score:

                        {" "}

                        <strong>

                          {score.toFixed(1)}

                          /100

                        </strong>

                      </span>


                      <br />


                      <span>

                        {safetyLabel}

                      </span>


                      {
                        typeof zone
                          .properties
                          ?.distance
                          === "number"
                        && (

                          <>

                            <br />

                            <span>

                              {
                                zone
                                  .properties
                                  .distance
                                  .toFixed(2)
                              }

                              {" km from you"}

                            </span>

                          </>

                        )
                      }

                    </div>

                  </Tooltip>


                  {/* ======================================
                      CLICK POPUP
                  ====================================== */}

                  <Popup>

                    <div

                      style={{

                        minWidth:
                          "210px"

                      }}

                    >

                      <h3

                        style={{

                          margin:
                            "0 0 8px 0"

                        }}

                      >

                        {
                          zone
                            .properties
                            ?.label
                            || "Unknown locality"
                        }

                      </h3>


                      <div>

                        <strong>
                          Safety:
                        </strong>

                        {" "}

                        {safetyLabel}

                      </div>


                      <div>

                        <strong>
                          Score:
                        </strong>

                        {" "}

                        {score.toFixed(1)}

                        /100

                      </div>


                      {
                        typeof zone
                          .properties
                          ?.distance
                          === "number"
                        && (

                          <div>

                            <strong>
                              Distance:
                            </strong>

                            {" "}

                            {
                              zone
                                .properties
                                .distance
                                .toFixed(2)
                            }

                            {" km"}

                          </div>

                        )
                      }


                      {
                        zone
                          .properties
                          ?.areaId
                        && (

                          <div>

                            <strong>
                              Area ID:
                            </strong>

                            {" "}

                            {
                              zone
                                .properties
                                .areaId
                            }

                          </div>

                        )
                      }

                    </div>

                  </Popup>

                </GeoJSON>

              );

            }

          )}


          {/* =================================================
              USER LOCATION
          ================================================= */}

          {userMarker && (

            <Marker

              position={[

                userMarker.lat,

                userMarker.lng

              ]}

              icon={userIcon}

              zIndexOffset={1000}

            >

              <Popup>

                <strong>
                  You are here
                </strong>

                <br />

                Live GPS location

                <br />

                <small>

                  AI analysis radius:
                  {" "}
                  20 km

                </small>

              </Popup>

            </Marker>

          )}

        </MapContainer>

      </div>


      {/* ====================================================
          LEGEND
      ==================================================== */}

      <div

        style={{

          display: "flex",

          flexWrap: "wrap",

          gap: "14px",

          padding: "10px 12px",

          fontSize: "12px"

        }}

      >

        <span>
          🟢 80–100 Safe
        </span>

        <span>
          🟡 60–79 Moderate
        </span>

        <span>
          🟠 40–59 Risky
        </span>

        <span>
          🔴 0–39 High Risk
        </span>

      </div>

    </div>

  );

}

