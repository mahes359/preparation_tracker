// src/middleware/auth.js
// Clerk authentication middleware — safe when keys are not yet configured.
// When CLERK_SECRET_KEY is a placeholder or missing, all auth middleware
// becomes a no-op so the rest of the app still works for development.

const env = require('../config/env');

const isClerkConfigured =
  env.CLERK_SECRET_KEY &&
  env.CLERK_SECRET_KEY !== 'sk_test_REPLACE_ME' &&
  env.CLERK_SECRET_KEY.startsWith('sk_');

let _clerkMiddleware, _getAuth, _requireAuth, _clerkClient;

if (isClerkConfigured) {
  const clerkExpress = require('@clerk/express');
  _clerkMiddleware = clerkExpress.clerkMiddleware;
  _getAuth = clerkExpress.getAuth;
  _requireAuth = clerkExpress.requireAuth;
  _clerkClient = clerkExpress.clerkClient;
  console.log('🔐  Clerk auth: enabled');
} else {
  console.warn(
    '⚠️   Clerk auth: NOT configured.\n' +
    '     Set CLERK_SECRET_KEY in server/.env to enable authentication.\n' +
    '     Running in open-access mode (no auth enforced).'
  );
}

// ── Middleware factories ──────────────────────────────────────────────────────

/**
 * Global Clerk middleware — populates req.auth on every request.
 * No-op if Clerk is not configured.
 */
const clerk = isClerkConfigured
  ? _clerkMiddleware()
  : (req, res, next) => next();

/**
 * Route guard — rejects unauthenticated requests with 401.
 * In open-access mode (no Clerk keys), skips the check.
 */
const requireClerkAuth = isClerkConfigured
  ? _requireAuth({ signInUrl: '/sign-in' })
  : (req, res, next) => next();

/**
 * Returns the Clerk auth object for the current request.
 * Returns { userId: null } if Clerk is not configured.
 */
const getAuth = isClerkConfigured
  ? _getAuth
  : () => ({ userId: null });

/**
 * Clerk client for fetching user profiles.
 */
const clerkClient = isClerkConfigured ? _clerkClient : null;

module.exports = { clerk, requireClerkAuth, getAuth, clerkClient, isClerkConfigured };
