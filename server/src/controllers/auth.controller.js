// src/controllers/auth.controller.js
// Handles Clerk user ↔ Student sync.
//
// Flow:
// 1. Frontend calls POST /auth/sync after every Clerk login
// 2. We look up the student by clerkId
// 3. If found → return existing student (possibly linking by email on first call)
// 4. If not found → create a new Student from Clerk profile data
// 5. Return { student, isNew } so frontend knows whether this is first login

const { getAuth, clerkClient } = require('@clerk/express');
const Student = require('../models/Student');
const asyncHandler = require('../middleware/asyncHandler');

const AVATAR_COLORS = [
  '#6c63ff', '#f64f59', '#11998e', '#f7971e', '#c471ed',
  '#12c2e9', '#43cea2', '#ee0979', '#4776e6', '#1d976c',
];

const pickColor = (email) => {
  // Deterministic color from email hash
  const hash = [...email].reduce((h, c) => h + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

/**
 * POST /auth/sync
 * Called by the frontend right after Clerk login.
 * Creates or fetches the Student record tied to the Clerk user.
 */
const syncUser = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ success: false, message: 'Not authenticated' });

  // Fetch Clerk user profile to get name + email
  const clerkUser = await clerkClient.users.getUser(userId);
  const email = clerkUser.emailAddresses?.[0]?.emailAddress?.toLowerCase() || '';
  const firstName = clerkUser.firstName || '';
  const lastName = clerkUser.lastName || '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || email.split('@')[0];

  // 1. Try to find by clerkId (returning user)
  let student = await Student.findOne({ clerkId: userId }).lean({ virtuals: true });

  if (student) {
    return res.json({ success: true, data: { student, isNew: false } });
  }

  // 2. Try to find by email (seeded student logging in for first time)
  student = await Student.findOneAndUpdate(
    { email, isActive: true },
    { clerkId: userId },  // link the Clerk ID to the existing student
    { new: true }
  ).lean({ virtuals: true });

  if (student) {
    return res.json({ success: true, data: { student, isNew: false, linked: true } });
  }

  // 3. Brand new user → create Student automatically
  const newStudent = await Student.create({
    name: fullName,
    email,
    clerkId: userId,
    avatarColor: pickColor(email),
    isActive: true,
  });

  return res.status(201).json({
    success: true,
    data: { student: newStudent.toObject({ virtuals: true }), isNew: true },
  });
});

/**
 * GET /auth/me
 * Returns the Student record for the currently authenticated Clerk user.
 */
const getMe = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ success: false, message: 'Not authenticated' });

  const student = await Student.findOne({ clerkId: userId, isActive: true }).lean({ virtuals: true });
  if (!student) return res.status(404).json({ success: false, message: 'Student record not found. Please log in again.' });

  res.json({ success: true, data: student });
});

module.exports = { syncUser, getMe };
