const mongoose = require('mongoose');

// If USE_MEMORY_DB=true (or no MONGO_URI is set at all), spin up a temporary
// in-memory MongoDB instance instead of connecting to a real one. This is
// meant purely for local development/testing when you don't want to install
// MongoDB or set up Atlas yet. Data does NOT persist across server restarts.
let memoryServer = null;

const connectDB = async () => {
  const useMemory = process.env.USE_MEMORY_DB === 'true' || !process.env.MONGO_URI;

  try {
    let uri = process.env.MONGO_URI;

    if (useMemory) {
      // Lazy-require so this package is only needed when actually used.
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      uri = memoryServer.getUri();
      console.log('[MongoDB] USE_MEMORY_DB is on — using a temporary in-memory database.');
      console.log('[MongoDB] Data will NOT persist after the server stops. Set MONGO_URI in .env to use a real database.');
    }

    await mongoose.connect(uri);
    console.log('[MongoDB] Connected');
  } catch (err) {
    console.error('[MongoDB] Connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
