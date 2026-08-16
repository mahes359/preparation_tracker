// src/controllers/students.controller.js

const Student = require('../models/Student');
const asyncHandler = require('../middleware/asyncHandler');
const { getStudentStats, getStudentHistory, getLeaderboard, getStudentDailyProgress, calculateCurrentStreak } = require('../services/leaderboard.service');
const { getCurrentStudent } = require('../middleware/rbac');

const getStudents = asyncHandler(async (req, res) => {
  const requester = await getCurrentStudent(req);

  // Admin sees everyone
  if (requester && requester.role === 'ADMIN') {
    const students = await Student.find({ isActive: true }).lean({ virtuals: true });
    return res.json({ success: true, data: students });
  }

  // Authenticated member sees only group-mates in the requested group
  if (requester && requester.groupIds && requester.groupIds.length > 0) {
    const groupId = req.query.groupId || null;
    const filterGroupIds = groupId ? [groupId] : requester.groupIds;
    const students = await Student.find({
      isActive: true,
      groupIds: { $in: filterGroupIds },
    }).lean({ virtuals: true });
    return res.json({ success: true, data: students });
  }

  // No group membership — return empty list
  res.json({ success: true, data: [] });
});

const getStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id).lean({ virtuals: true });
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
  res.json({ success: true, data: student });
});

const createStudent = asyncHandler(async (req, res) => {
  const { name, email, avatarColor } = req.body;
  const student = await Student.create({ name, email, avatarColor });
  res.status(201).json({ success: true, data: student });
});

const updateStudent = asyncHandler(async (req, res) => {
  const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).lean({ virtuals: true });
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
  res.json({ success: true, data: student });
});

const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
  res.json({ success: true, message: 'Student deactivated successfully' });
});

const getStudentStatsHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const groupId = req.query.groupId || null;

  const student = await Student.findById(id).lean({ virtuals: true });
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

  const resolvedGroupId = groupId || student.groupId || null;
  const [stats, history, leaderboard, dailyProgress] = await Promise.all([
    getStudentStats(id, resolvedGroupId),
    getStudentHistory(id, 30, resolvedGroupId),
    getLeaderboard(resolvedGroupId),
    getStudentDailyProgress(id, resolvedGroupId, 60),
  ]);

  const rankEntry = leaderboard.find((r) => r.student._id.toString() === id);
  const rank = rankEntry ? rankEntry.rank : null;
  const weeklySummary = (() => {
    if (!dailyProgress || dailyProgress.length === 0) {
      return { completionRate: 0, questionsSolved: 0, onTime: 0, late: 0, points: 0 };
    }
    const recent = [...dailyProgress].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);
    const totalQuestions = recent.reduce((sum, day) => sum + (day.totalQuestions || 0), 0);
    const solved = recent.reduce((sum, day) => sum + (day.completed || 0), 0);
    const onTime = recent.reduce((sum, day) => sum + (day.onTime || 0), 0);
    const late = recent.reduce((sum, day) => sum + (day.late || 0), 0);
    const points = recent.reduce((sum, day) => sum + (day.points || 0), 0);
    const completionRate = totalQuestions > 0 ? Math.round((solved / totalQuestions) * 100) : 0;
    return { completionRate, questionsSolved: solved, onTime, late, points };
  })();

  res.json({
    success: true,
    data: {
      student,
      stats,
      rank,
      history,
      dailyProgress,
      currentStreak: calculateCurrentStreak(dailyProgress),
      weeklySummary,
    },
  });
});

module.exports = { getStudents, getStudent, createStudent, updateStudent, deleteStudent, getStudentStatsHandler };
