// src/services/problem.service.js
// Business logic for problem creation and completion.

const Problem = require('../models/Problem');
const { startOfDayUTC, endOfDayUTC, buildDeadline, titleFromUrl } = require('../utils/dateUtils');
const { getActiveConfig, calculatePoints } = require('./scoring.service');

/**
 * Fetch all problems for a given date, populated with student details.
 */
const getProblemsForDate = async (date) => {
  const dayStart = startOfDayUTC(date);
  const dayEnd = endOfDayUTC(date);

  return Problem.find({ date: { $gte: dayStart, $lte: dayEnd } })
    .populate('studentId', 'name email avatarColor initials')
    .sort({ createdAt: 1 })
    .lean({ virtuals: true });
};

/**
 * Create a new problem for a student on a given date.
 * A student can only submit one problem per day.
 */
const createProblem = async ({ studentId, leetcodeUrl, date }) => {
  const config = await getActiveConfig();
  const problemDate = startOfDayUTC(date || new Date());
  const deadline = buildDeadline(problemDate, config.deadlineHourUTC);

  // Enforce one-problem-per-student-per-day rule
  const existing = await Problem.findOne({
    studentId,
    date: { $gte: problemDate, $lte: endOfDayUTC(problemDate) },
  });

  if (existing) {
    const error = new Error('Student already submitted a problem for this date');
    error.statusCode = 409;
    throw error;
  }

  const title = titleFromUrl(leetcodeUrl);

  const problem = await Problem.create({
    studentId,
    date: problemDate,
    leetcodeUrl,
    title,
    deadline,
  });

  return Problem.findById(problem._id)
    .populate('studentId', 'name email avatarColor initials')
    .lean({ virtuals: true });
};

/**
 * Mark a problem as completed, calculate and store points.
 */
const completeProblem = async (problemId) => {
  const problem = await Problem.findById(problemId);

  if (!problem) {
    const error = new Error('Problem not found');
    error.statusCode = 404;
    throw error;
  }

  if (problem.isCompleted) {
    const error = new Error('Problem is already marked as completed');
    error.statusCode = 400;
    throw error;
  }

  const config = await getActiveConfig();
  const completedAt = new Date();
  const { pointsEarned, isOnTime } = calculatePoints(completedAt, problem.deadline, config);

  problem.isCompleted = true;
  problem.completedAt = completedAt;
  problem.isOnTime = isOnTime;
  problem.pointsEarned = pointsEarned;
  await problem.save();

  return Problem.findById(problem._id)
    .populate('studentId', 'name email avatarColor initials')
    .lean({ virtuals: true });
};

/**
 * Get a single problem by ID.
 */
const getProblemById = async (id) => {
  const problem = await Problem.findById(id)
    .populate('studentId', 'name email avatarColor initials')
    .lean({ virtuals: true });

  if (!problem) {
    const error = new Error('Problem not found');
    error.statusCode = 404;
    throw error;
  }

  return problem;
};

/**
 * Delete a problem — only allowed if it was created today and not yet completed.
 */
const deleteProblem = async (id) => {
  const problem = await Problem.findById(id);
  if (!problem) {
    const error = new Error('Problem not found');
    error.statusCode = 404;
    throw error;
  }
  if (problem.isCompleted) {
    const error = new Error('Cannot delete a completed problem');
    error.statusCode = 400;
    throw error;
  }
  await problem.deleteOne();
};

module.exports = { getProblemsForDate, createProblem, completeProblem, getProblemById, deleteProblem };
