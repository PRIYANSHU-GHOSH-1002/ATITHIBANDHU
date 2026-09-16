require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const initLocationSocket = require('./sockets/locationSocket');

const authRoutes = require('./routes/auth');
const touristRoutes = require('./routes/tourist');
const geofenceRoutes = require('./routes/geofence');
const sosRoutes = require('./routes/sos');

const app = express();

const corsOrigin = process.env.CLIENT_ORIGIN || '*';

app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'AtithiBandhu API',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/tourist', touristRoutes);
app.use('/api/geofence', geofenceRoutes);
app.use('/api/sos', sosRoutes);

// Local Socket.IO server
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);

initLocationSocket(io);

const PORT = process.env.PORT || 5000;

// Local development
if (require.main === module) {
  connectDB().then(() => {
    server.listen(PORT, () => {
      console.log(
        `[AtithiBandhu API] listening on port ${PORT}`
      );
    });
  });
}

// Vercel / serverless
module.exports = async (req, res) => {
  try {
    await connectDB();
    return app(req, res);
  } catch (error) {
    console.error('[Vercel] Database connection failed:', error);

    return res.status(500).json({
      message: 'Database connection failed',
      error: error.message,
    });
  }
};