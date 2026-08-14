// src/controllers/problems.controller.js

const asyncHandler = require('../middleware/asyncHandler');
const problemService = require('../services/problem.service');
const Student = require('../models/Student');
const { getAuth, isClerkConfigured } = require('../middleware/auth');

const studentForMutation = async (req, requestedStudentId) => {
  if (!isClerkConfigured) return requestedStudentId;
  const { userId } = getAuth(req);
  if (!userId) {
    const error = new Error('Authentication is required');
    error.statusCode = 401;
    throw error;
  }
  const student = await Student.findOne({ clerkId: userId, isActive: true }).lean();
  if (!student || student._id.toString() !== requestedStudentId) {
    const error = new Error('You can only update your own challenge records');
    error.statusCode = 403;
    throw error;
  }
  return student._id;
};

const viewerStudentForRead = async (req) => {
  if (!isClerkConfigured) return req.query.studentId || null;
  const { userId } = getAuth(req);
  if (!userId) return null;
  const student = await Student.findOne({ clerkId: userId, isActive: true }).lean();
  return student?._id || null;
};

const getProblems = asyncHandler(async (req, res) => {
  // ?date=YYYY-MM-DD  (defaults to today)
  const date = req.query.date || undefined;
  const problems = await problemService.getProblemsForDate(date, await viewerStudentForRead(req));
  res.json({ success: true, data: problems });
});

const getProblem = asyncHandler(async (req, res) => {
  const problem = await problemService.getProblemById(req.params.id, await viewerStudentForRead(req));
  res.json({ success: true, data: problem });
});

const createProblem = asyncHandler(async (req, res) => {
  const { studentId, leetcodeUrl, date } = req.body;
  const problem = await problemService.createProblem({
    studentId: await studentForMutation(req, studentId), leetcodeUrl, date,
  });
  res.status(201).json({ success: true, data: problem });
});

const completeProblem = asyncHandler(async (req, res) => {
  const problem = await problemService.completeProblem(
    req.params.id, await studentForMutation(req, req.body.studentId)
  );
  res.json({
    success: true,
    data: problem,
    pointsEarned: problem.pointsEarned,
    isOnTime: problem.isOnTime,
  });
});

const saveProgressNote = asyncHandler(async (req, res) => {
  const progress = await problemService.saveProgressNote(
    req.params.id, await studentForMutation(req, req.body.studentId), req.body.note
  );
  res.json({ success: true, data: progress });
});

const deleteProblem = asyncHandler(async (req, res) => {
  await problemService.deleteProblem(req.params.id);
  res.json({ success: true, message: 'Problem deleted successfully' });
});

module.exports = { getProblems, getProblem, createProblem, completeProblem, saveProgressNote, deleteProblem };
