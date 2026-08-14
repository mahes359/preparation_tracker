const mongoose = require('mongoose');
const Completion = require('../models/Completion');
const Student = require('../models/Student');
const Problem = require('../models/Problem');

const buildStudentStatMatch = (studentId, groupId) => {
  const match = { studentId: new mongoose.Types.ObjectId(studentId) };
  if (groupId) match.groupId = new mongoose.Types.ObjectId(groupId);
  return match;
};

const getLeaderboard = async (groupId = null) => {
  const match = { completedAt: { $ne: null } };
  if (groupId) match.groupId = new mongoose.Types.ObjectId(groupId);

  const aggregated = await Completion.aggregate([
    { $match: match },
    { $group: {
      _id: '$studentId', totalPoints: { $sum: '$pointsEarned' }, completedCount: { $sum: 1 },
      onTimeCount: { $sum: { $cond: ['$isOnTime', 1, 0] } },
      lateCount: { $sum: { $cond: ['$isOnTime', 0, 1] } },
    } },
  ]);

  const studentFilter = { isActive: true };
  if (groupId) studentFilter.groupIds = new mongoose.Types.ObjectId(groupId);

  const allStudents = await Student.find(studentFilter).lean({ virtuals: true });
  const statsMap = new Map(aggregated.map((stat) => [stat._id.toString(), stat]));

  return allStudents.map((student) => ({
    student,
    ...(statsMap.get(student._id.toString()) || {
      totalPoints: 0, completedCount: 0, onTimeCount: 0, lateCount: 0,
    }),
  })).sort((a, b) => b.totalPoints - a.totalPoints || b.onTimeCount - a.onTimeCount ||
    b.completedCount - a.completedCount || a.student.name.localeCompare(b.student.name))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
};

const getStudentStats = async (studentId, groupId = null) => {
  const objectId = new mongoose.Types.ObjectId(studentId);
  const completionMatch = buildStudentStatMatch(studentId, groupId);
  const problemMatch = { studentId: objectId };
  if (groupId) problemMatch.groupId = new mongoose.Types.ObjectId(groupId);

  const [stats, questionsPosted, totalQuestions] = await Promise.all([
    Completion.aggregate([
      { $match: { ...completionMatch, completedAt: { $ne: null } } },
      { $group: {
        _id: '$studentId', totalPoints: { $sum: '$pointsEarned' },
        completedCount: { $sum: 1 }, onTimeCount: { $sum: { $cond: ['$isOnTime', 1, 0] } },
        lateCount: { $sum: { $cond: ['$isOnTime', 0, 1] } },
      } },
    ]),
    Problem.countDocuments(problemMatch),
    Problem.countDocuments(groupId ? { groupId: new mongoose.Types.ObjectId(groupId) } : {}),
  ]);

  const completed = stats?.[0]?.completedCount || 0;
  const totalRelevantQuestions = totalQuestions || 0;

  return {
    totalPoints: stats?.[0]?.totalPoints || 0,
    questionsPosted: questionsPosted || 0,
    totalQuestions: totalRelevantQuestions,
    completedCount: completed,
    pendingCount: Math.max((questionsPosted || 0) - completed, 0),
    onTimeCount: stats?.[0]?.onTimeCount || 0,
    lateCount: stats?.[0]?.lateCount || 0,
  };
};

const getGroupStats = async (groupId = null) => {
  const problemMatch = groupId ? { groupId: new mongoose.Types.ObjectId(groupId) } : {};
  const completionMatch = { completedAt: { $ne: null } };
  if (groupId) completionMatch.groupId = new mongoose.Types.ObjectId(groupId);

  const [questionsPosted, activeStudents, completionStats] = await Promise.all([
    Problem.countDocuments(problemMatch),
    Student.countDocuments({ isActive: true, ...(groupId ? { groupIds: new mongoose.Types.ObjectId(groupId) } : {}) }),
    Completion.aggregate([
      { $match: completionMatch },
      { $group: {
        _id: null,
        totalPoints: { $sum: '$pointsEarned' },
        totalCompleted: { $sum: 1 },
        onTime: { $sum: { $cond: ['$isOnTime', 1, 0] } },
        late: { $sum: { $cond: ['$isOnTime', 0, 1] } },
      } },
    ]),
  ]);

  const requiredCompletions = questionsPosted * Math.max(activeStudents, 1);
  const totalCompleted = completionStats[0]?.totalCompleted || 0;
  const completionRate = requiredCompletions > 0 ? Math.round((totalCompleted / requiredCompletions) * 100) : 0;

  return {
    questionsPosted,
    totalCompletions: totalCompleted,
    totalRequiredCompletions: requiredCompletions,
    completionRate,
    onTimeCompletions: completionStats[0]?.onTime || 0,
    lateCompletions: completionStats[0]?.late || 0,
  };
};

const getStudentHistory = async (studentId, limit = 30, groupId = null) => {
  const objectId = new mongoose.Types.ObjectId(studentId);
  const match = { studentId: objectId, completedAt: { $ne: null } };
  if (groupId) match.groupId = new mongoose.Types.ObjectId(groupId);

  const records = await Completion.find(match).populate('problemId').sort({ completedAt: -1 }).limit(limit).lean();
  return records.filter(({ problemId }) => problemId).map((record) => ({
    ...record.problemId, date: record.problemId.challengeDate || record.problemId.date,
    isCompleted: true, isOnTime: record.isOnTime, pointsEarned: record.pointsEarned,
  }));
};

module.exports = { getLeaderboard, getGroupStats, getStudentStats, getStudentHistory };
