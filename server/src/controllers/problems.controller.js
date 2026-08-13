// src/controllers/problems.controller.js

const asyncHandler = require('../middleware/asyncHandler');
const problemService = require('../services/problem.service');

const getProblems = asyncHandler(async (req, res) => {
  // ?date=YYYY-MM-DD  (defaults to today)
  const date = req.query.date ? new Date(req.query.date) : new Date();
  const problems = await problemService.getProblemsForDate(date);
  res.json({ success: true, data: problems });
});

const getProblem = asyncHandler(async (req, res) => {
  const problem = await problemService.getProblemById(req.params.id);
  res.json({ success: true, data: problem });
});

const createProblem = asyncHandler(async (req, res) => {
  const { studentId, leetcodeUrl, date } = req.body;
  const problem = await problemService.createProblem({ studentId, leetcodeUrl, date });
  res.status(201).json({ success: true, data: problem });
});

const completeProblem = asyncHandler(async (req, res) => {
  const problem = await problemService.completeProblem(req.params.id);
  res.json({
    success: true,
    data: problem,
    pointsEarned: problem.pointsEarned,
    isOnTime: problem.isOnTime,
  });
});

const deleteProblem = asyncHandler(async (req, res) => {
  await problemService.deleteProblem(req.params.id);
  res.json({ success: true, message: 'Problem deleted successfully' });
});

module.exports = { getProblems, getProblem, createProblem, completeProblem, deleteProblem };
