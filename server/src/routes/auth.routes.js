// src/routes/auth.routes.js

const router = require('express').Router();
const { requireClerkAuth } = require('../middleware/auth');
const { syncUser, getMe } = require('../controllers/auth.controller');

// POST /auth/sync — called by frontend after every Clerk login
router.post('/sync', requireClerkAuth, syncUser);

// GET /auth/me — returns current student record
router.get('/me', requireClerkAuth, getMe);

module.exports = router;
