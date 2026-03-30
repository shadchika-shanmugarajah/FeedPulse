import dotenv from 'dotenv';
import mongoose from 'mongoose';
import app from './app';

dotenv.config();

const PORT = Number(process.env.PORT) || 4000;
const MONGO_URI = process.env.MONGO_URI || '';

if (!MONGO_URI) {
  console.error('Missing MONGO_URI. Copy backend/.env.example to backend/.env and set your connection string.');
  process.exit(1);
}

const safeMongoUri = MONGO_URI.replace(/(mongodb\+srv:\/\/[^:]+:)([^@]+)(@)/, '$1*****$3');

async function startServer() {
  try {
    console.log(`Connecting to MongoDB: ${safeMongoUri}`);
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    console.log(`FeedPulse backend listening on http://localhost:${PORT}`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Stop the other process or set PORT in .env.`);
      process.exit(1);
    }
    throw err;
  });
}

startServer();
