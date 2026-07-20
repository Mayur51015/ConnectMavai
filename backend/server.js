require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Import routes
const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageRoutes');
const userRoutes = require('./routes/userRoutes');
const roomRoutes = require('./routes/roomRoutes');
const contactRoutes = require('./routes/contactRoutes');
const callRoutes = require('./routes/callRoutes');

// Import socket handler
const { initializeSocket } = require('./socket/socketHandler');

// Exact allowed origins for local dev and main production
const defaultExactOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://connect-mavai.vercel.app',
  'https://connectmavai-2.onrender.com',
];

const envOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((url) => url.trim().replace(/\/$/, ''))
  : [];

const exactOriginsSet = new Set([...defaultExactOrigins, ...envOrigins]);

/**
 * Validates if incoming origin is permitted:
 * 1. Server-to-server / curl / Postman (no origin header)
 * 2. Exact match in exactOriginsSet
 * 3. Any Vercel domain or preview deployment matching *.vercel.app
 */
const isOriginAllowed = (origin) => {
  if (!origin) return true;
  const cleanOrigin = origin.replace(/\/$/, '');

  // Exact match check
  if (exactOriginsSet.has(cleanOrigin)) return true;

  // Vercel production & preview deployment regex matching (e.g. *.vercel.app)
  if (/^https:\/\/([a-z0-9-]+\.)?vercel\.app$/i.test(cleanOrigin)) {
    return true;
  }

  return false;
};

// Unified CORS options for Express and Socket.IO
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      console.log('[CORS Allowed] Server-to-server / No Origin Header');
      return callback(null, true);
    }

    if (isOriginAllowed(origin)) {
      console.log(`[CORS Allowed] Origin: ${origin}`);
      return callback(null, true);
    }

    console.warn(`[CORS Blocked] Origin: ${origin}`);
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200,
};

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with identical CORS configuration
const io = new Server(server, {
  cors: {
    ...corsOptions,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  },
});

// --- Middleware Chain (Strict Execution Order) ---

// 1. Enable CORS and Preflight handling across all routes
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// 2. Parse JSON payloads
app.use(express.json());

// 3. Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// 4. Request Logging Middleware
app.use((req, res, next) => {
  const start = Date.now();
  const origin = req.headers.origin || 'No-Origin-Header';
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `[HTTP Log] ${req.method} ${req.originalUrl} | Origin: ${origin} | Status: ${res.statusCode} (${duration}ms)`
    );
  });

  next();
});

// 5. Serve static file uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 6. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/calls', callRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// 7. 404 Route Handler
app.use((req, res) => {
  console.warn(`[404 Not Found] ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// 8. Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Global Error Handler]', err);
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
  });
});

// Initialize Socket.IO event handlers
initializeSocket(io);

// Server startup & Mongoose connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/connectmavai';

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB connection lost.');
});

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('📦 Connected to MongoDB Atlas');
    server.listen(PORT, () => {
      console.log(`🚀 ConnectMavai server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ Fatal MongoDB connection error:', error.message);
    process.exit(1);
  });

module.exports = { app, server, io };
