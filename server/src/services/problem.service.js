const Problem = require('../models/Problem');
const Completion = require('../models/Completion');
const { startOfDayUTC, endOfDayUTC, buildDeadline, titleFromUrl, toDateString } = require('../utils/dateUtils');
const { getActiveConfig, calculatePoints } = require('./scoring.service');

const attachCompletions = async (problems, viewerStudentId) => {
  const ids = problems.map((problem) => problem._id);
  const completions = await Completion.find({ problemId: { $in: ids } })
    .populate('studentId', 'name email avatarColor initials')
    .lean({ virtuals: true });
  const byProblem = new Map();
  completions.forEach((completion) => {
    if (!viewerStudentId || completion.studentId?._id?.toString() !== viewerStudentId.toString()) {
      delete completion.note;
    }
    const key = completion.problemId.toString();
    byProblem.set(key, [...(byProblem.get(key) || []), completion]);
  });
  return problems.map((problem) => ({ ...problem, completions: byProblem.get(problem._id.toString()) || [] }));
};

const getProblemsForDate = async (date, viewerStudentId) => {
  const challengeDate = toDateString(date);
  const dayStart = startOfDayUTC(challengeDate);
  const dayEnd = endOfDayUTC(challengeDate);
  // The date-range fallback keeps previously stored questions visible after the
  // challengeDate identifier was introduced.
  const problems = await Problem.find({
    $or: [{ challengeDate }, { challengeDate: { $exists: false }, date: { $gte: dayStart, $lte: dayEnd } }],
  })
    .populate('studentId', 'name email avatarColor initials')
    .sort({ createdAt: 1 })
    .lean({ virtuals: true });
  return attachCompletions(problems, viewerStudentId);
};

const createProblem = async ({ studentId, leetcodeUrl, date }) => {
  const config = await getActiveConfig();
  const challengeDate = toDateString(date || new Date());
  const problemDate = startOfDayUTC(challengeDate);
  const deadline = buildDeadline(problemDate, config.deadlineHour, config.deadlineMinute);
  const existing = await Problem.findOne({ studentId, challengeDate });
  if (existing) {
    const error = new Error('Student already submitted a problem for this date');
    error.statusCode = 409;
    throw error;
  }
  const problem = await Problem.create({
    studentId, challengeDate, date: problemDate, leetcodeUrl,
    title: titleFromUrl(leetcodeUrl), deadline,
  });
  return Problem.findById(problem._id).populate('studentId', 'name email avatarColor initials').lean({ virtuals: true });
};

const completeProblem = async (problemId, studentId) => {
  const problem = await Problem.findById(problemId);
  if (!problem) {
    const error = new Error('Problem not found');
    error.statusCode = 404;
    throw error;
  }
  const existing = await Completion.findOne({ problemId, studentId });
  if (existing?.completedAt) {
    existing.status = 'pending';
    existing.completedAt = null;
    existing.isOnTime = null;
    existing.pointsEarned = 0;
    await existing.save();
    return Completion.findById(existing._id)
      .populate('studentId', 'name email avatarColor initials')
      .lean({ virtuals: true });
  }
  const config = await getActiveConfig();
  const completedAt = new Date();
  const { pointsEarned, isOnTime } = calculatePoints(completedAt, problem.deadline, config);
  const completion = await Completion.findOneAndUpdate(
    { problemId, studentId },
    {
      $set: { status: 'completed', completedAt, isOnTime, pointsEarned },
      $setOnInsert: { challengeDate: problem.challengeDate || toDateString(problem.date) },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return Completion.findById(completion._id).populate('studentId', 'name email avatarColor initials').lean({ virtuals: true });
};

const getProblemById = async (id, viewerStudentId) => {
  const problem = await Problem.findById(id).populate('studentId', 'name email avatarColor initials').lean({ virtuals: true });
  if (!problem) {
    const error = new Error('Problem not found');
    error.statusCode = 404;
    throw error;
  }
  return (await attachCompletions([problem], viewerStudentId))[0];
};

const saveProgressNote = async (problemId, studentId, note) => {
  const problem = await Problem.findById(problemId);
  if (!problem) {
    const error = new Error('Problem not found');
    error.statusCode = 404;
    throw error;
  }
  const progress = await Completion.findOneAndUpdate(
    { problemId, studentId },
    {
      $set: { note },
      $setOnInsert: {
        challengeDate: problem.challengeDate || toDateString(problem.date),
        status: 'pending', pointsEarned: 0,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return Completion.findById(progress._id).populate('studentId', 'name email avatarColor initials').lean({ virtuals: true });
};

const deleteProblem = async (id) => {
  const problem = await Problem.findById(id);
  if (!problem) {
    const error = new Error('Problem not found');
    error.statusCode = 404;
    throw error;
  }
  const hasCompletions = await Completion.exists({ problemId: id });
  if (hasCompletions) {
    const error = new Error('Cannot delete a problem that has completions');
    error.statusCode = 400;
    throw error;
  }
  await problem.deleteOne();
};

module.exports = { getProblemsForDate, createProblem, completeProblem, saveProgressNote, getProblemById, deleteProblem };
