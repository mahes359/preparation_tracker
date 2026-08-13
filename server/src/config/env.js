// src/config/env.js
// Centralised environment variable access.
// All process.env reads go through here so the rest of the app
// never touches process.env directly.

require('dotenv').config();

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/interview-tracker',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  DEADLINE_HOUR_UTC: parseInt(process.env.DEADLINE_HOUR_UTC || '18', 10),
  // Clerk — set in .env
  CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY || '',
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || '',
};

module.exports = env;
