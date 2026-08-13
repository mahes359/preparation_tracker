// src/app.js
// Express application setup (no server.listen here — see server.js).

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const env = require('./config/env');
const routes = require('./routes/index');
const errorHandler = require('./middleware/errorHandler');
const { clerk } = require('./middleware/auth');

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Clerk middleware — must be before routes.
// Populates req.auth on every request (no blocking — individual routes opt-in to requireClerkAuth).
app.use(clerk);

// ── Routes ────────────────────────────────────────────────────────────────────

app.use('/api/v1', routes);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Error Handler (must be last) ─────────────────────────────────────────────

app.use(errorHandler);

module.exports = app;
