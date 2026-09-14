// Integration point for the external AI safety-classification model.
//
// HOW TO PLUG IN YOUR REAL MODEL (zero code changes needed):
//   1. Set AI_MODEL_URL in backend/.env to your model's endpoint.
//   2. Optionally set AI_MODEL_API_KEY if it requires auth.
//   3. That's it — this file will start calling it automatically.
//
// CONTRACT your model API must follow:
//   Request:  POST {AI_MODEL_URL}
//             Headers: Content-Type: application/json
//                      Authorization: Bearer <AI_MODEL_API_KEY>   (if set)
//             Body:    { "lat": number, "lng": number, "touristId": string, "timestamp": ISOString }
//
//   Response: 200 OK, JSON body:
//             {
//               "status": "safe" | "moderate" | "unsafe",   // required
//               "riskScore": number,                         // optional, 0-1
//               "message": string                            // optional, human-readable note
//             }
//
// If AI_MODEL_URL is not set, classifySafety() simply returns null and the
// system falls back to geofence-only classification (see sockets/locationSocket.js).
// If the model call fails or times out, it also returns null rather than
// throwing, so a flaky/slow model never breaks live location tracking.

const TIMEOUT_MS = Number(process.env.AI_MODEL_TIMEOUT_MS || 3000);

async function classifySafety({ lat, lng, touristId, timestamp }) {
  const url = process.env.AI_MODEL_URL;
  if (!url) return null; // no model configured yet - caller should fall back gracefully

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (process.env.AI_MODEL_API_KEY) {
      headers.Authorization = `Bearer ${process.env.AI_MODEL_API_KEY}`;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ lat, lng, touristId, timestamp }),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.error(`[aiSafety] model returned ${res.status}`);
      return null;
    }

    const data = await res.json();
    if (!['safe', 'moderate', 'unsafe'].includes(data.status)) {
      console.error('[aiSafety] model response missing/invalid "status" field');
      return null;
    }

    return {
      status: data.status,
      riskScore: typeof data.riskScore === 'number' ? data.riskScore : null,
      message: data.message || null,
    };
  } catch (err) {
    console.error('[aiSafety] model call failed:', err.message);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { classifySafety };
