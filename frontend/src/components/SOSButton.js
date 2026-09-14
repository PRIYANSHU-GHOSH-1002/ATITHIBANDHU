// import { useState } from 'react';
// import { getSocket } from '../services/socket';

// // Big panic button. Sends the tourist's last known coordinates via the
// // live socket connection so the admin dashboard gets it instantly.
// export default function SOSButton({ position }) {
//   const [sent, setSent] = useState(false);
//   const [ack, setAck] = useState('');

//   function trigger() {
//     const socket = getSocket();
//     socket.emit('sos:trigger', {
//       lat: position?.lat,
//       lng: position?.lng,
//       message: 'Emergency SOS triggered by tourist',
//     });
//     socket.once('sos:ack', (data) => setAck(data.message));
//     setSent(true);
//     setTimeout(() => setSent(false), 5000);
//   }

//   return (
//     <div className="sos-wrap">
//       <button className="sos-button" onClick={trigger}>
//         {sent ? 'SENT' : 'SOS'}
//       </button>
//       {ack && <p className="sos-ack">{ack}</p>}
//     </div>
//   );
// }

// components/SOSButton.jsx
import api from "../services/api";
import { useState } from "react";

export default function SOSButton({ position }) {
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");

  async function handleSOS() {
    if (!position) {
      setStatus("Location not available yet.");
      return;
    }
    setSending(true);
    setStatus("");
    try {
      await api.post("/sos", { lat: position.lat, lng: position.lng, message: "Emergency SOS triggered" });
      setStatus("SOS sent to your emergency contact.");
    } catch (err) {
      setStatus("Failed to send SOS. Try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="sos-wrapper">
      <button className="sos-button" onClick={handleSOS} disabled={sending}>
        {sending ? "Sending..." : "SOS"}
      </button>
      {status && <p className="sos-status">{status}</p>}
    </div>
  );
}