const mongoose = require('mongoose');
const Completion = require('../models/Completion');
const Student = require('../models/Student');
const Problem = require('../models/Problem');

const buildStudentStatMatch = (studentId, groupId) => {
  const match = { studentId: new mongoose.Types.ObjectId(studentId) };
  if (groupId) match.groupId = new mongoose.Types.ObjectId(groupId);
  return match;
};

const buildStudentStatsSummary = ({
  questionsPosted = 0,
  totalQuestions = 0,
  completedCount = 0,
  totalPoints = 0,
  onTimeCount = 0,
  lateCount = 0,
  activeMembers = 0,
} = {}) => {
  const safeTotalQuestions = Math.max(Number(totalQuestions) || 0, 0);
  const safeCompletedCount = Math.max(Number(completedCount) || 0, 0);
  const pendingCount = Math.max(safeTotalQuestions - safeCompletedCount, 0);
  const completionRate = safeTotalQuestions > 0 ? Math.round((safeCompletedCount / safeTotalQuestions) * 100) : 0;

  return {
    questionsPosted: Math.max(Number(questionsPosted) || 0, 0),
    totalQuestions: safeTotalQuestions,
    completedCount: safeCompletedCount,
    pendingCount,
    totalPoints: Math.max(Number(totalPoints) || 0, 0),
    onTimeCount: Math.max(Number(onTimeCount) || 0, 0),
    lateCount: Math.max(Number(lateCount) || 0, 0),
    completionRate,
    activeMembers: Math.max(Number(activeMembers) || 0, 0),
  };
};

const buildDailyProgressForStudent = (dailyRows = []) => {
  return dailyRows
    .map((entry) => {
      const totalQuestions = Number(entry.totalQuestions) || 0;
      const completed = Number(entry.completed) || 0;
      const pending = Math.max(totalQuestions - completed, 0);
      const completionRate = totalQuestions > 0 ? Math.round((completed / totalQuestions) * 100) : 0;
      return {
        date: entry.date,
        totalQuestions,
        completed,
        pending,
        completionRate,
        onTime: Number(entry.onTime) || 0,
        late: Number(entry.late) || 0,
        points: Number(entry.points) || 0,
        questions: Array.isArray(entry.questions) ? entry.questions.map((question) => ({
          ...question,
          points: Number(question.points) || 0,
          status: question.status || 'pending',
          isOnTime: question.isOnTime ?? null,
        })) : [],
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
};

const calculateCurrentStreak = (dailyProgress = []) => {
  let streak = 0;
  const ordered = [...dailyProgress].sort((a, b) => b.date.localeCompare(a.date));
  for (const day of ordered) {
    if (!day.totalQuestions || day.completed < day.totalQuestions) break;
    streak += 1;
  }
  return streak;
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
  const groupObjectId = groupId ? new mongoose.Types.ObjectId(groupId) : null;
  const completionMatch = buildStudentStatMatch(studentId, groupId);
  const problemMatch = { studentId: objectId };
  if (groupObjectId) problemMatch.groupId = groupObjectId;

  const [stats, questionsPosted, totalQuestions, activeMembers] = await Promise.all([
    Completion.aggregate([
      { $match: { ...completionMatch, completedAt: { $ne: null } } },
      { $group: {
        _id: '$studentId', totalPoints: { $sum: '$pointsEarned' },
        completedCount: { $sum: 1 }, onTimeCount: { $sum: { $cond: ['$isOnTime', 1, 0] } },
        lateCount: { $sum: { $cond: ['$isOnTime', 0, 1] } },
      } },
    ]),
    Problem.countDocuments(problemMatch),
    Problem.countDocuments(groupObjectId ? { groupId: groupObjectId } : {}),
    Student.countDocuments({ isActive: true, ...(groupObjectId ? { groupIds: groupObjectId } : {}) }),
  ]);

  const summary = buildStudentStatsSummary({
    questionsPosted: questionsPosted || 0,
    totalQuestions: totalQuestions || 0,
    completedCount: stats?.[0]?.completedCount || 0,
    totalPoints: stats?.[0]?.totalPoints || 0,
    onTimeCount: stats?.[0]?.onTimeCount || 0,
    lateCount: stats?.[0]?.lateCount || 0,
    activeMembers: activeMembers || 0,
  });

  return summary;
};

const getStudentDailyProgress = async (studentId, groupId = null, limitDays = 60) => {
  const objectId = new mongoose.Types.ObjectId(studentId);
  const groupObjectId = groupId ? new mongoose.Types.ObjectId(groupId) : null;
  const problemMatch = groupObjectId ? { groupId: groupObjectId } : {};

  const [problemDates, completionDates, challengeQuestions] = await Promise.all([
    Problem.aggregate([
      { $match: problemMatch },
      { $group: { _id: '$challengeDate', totalQuestions: { $sum: 1 } } },
      { $sort: { _id: -1 } },
      { $limit: limitDays },
    ]),
    Completion.aggregate([
      { $match: {
        studentId: objectId,
        ...(groupObjectId ? { groupId: groupObjectId } : {}),
        completedAt: { $ne: null },
      } },
      { $group: {
        _id: '$challengeDate',
        completed: { $sum: 1 },
        onTime: { $sum: { $cond: ['$isOnTime', 1, 0] } },
        late: { $sum: { $cond: ['$isOnTime', 0, 1] } },
        points: { $sum: '$pointsEarned' },
      } },
      { $sort: { _id: -1 } },
      { $limit: limitDays },
    ]),
    Problem.find(groupObjectId ? { groupId: groupObjectId } : {})
      .populate('studentId', 'name email avatarColor initials')
      .lean({ virtuals: true })
      .sort({ challengeDate: -1, createdAt: 1 }),
  ]);

  const dateToQuestions = new Map();
  challengeQuestions.forEach((problem) => {
    const key = problem.challengeDate || new Date(problem.date).toISOString().slice(0, 10);
    const arr = dateToQuestions.get(key) || [];
    arr.push({
      _id: problem._id,
      problemId: problem._id,
      title: problem.title,
      leetcodeUrl: problem.leetcodeUrl,
      challengeDate: key,
      studentId: problem.studentId,
      groupId: problem.groupId,
      points: 0,
      postedBy: problem.studentId?.name || 'Unknown',
      status: 'pending',
    });
    dateToQuestions.set(key, arr);
  });

  const completionMap = new Map(completionDates.map((entry) => [entry._id, entry]));
  const completionByDate = await Completion.find({
    studentId: objectId,
    ...(groupObjectId ? { groupId: groupObjectId } : {}),
    challengeDate: { $in: problemDates.map((entry) => entry._id) },
  }).populate('problemId', 'title leetcodeUrl challengeDate studentId').lean({ virtuals: true });

  completionByDate.forEach((record) => {
    const key = record.challengeDate;
    const arr = dateToQuestions.get(key) || [];
    const index = arr.findIndex((item) => item.problemId.toString() === record.problemId?._id?.toString());
    if (index >= 0) {
      arr[index].status = record.completedAt ? 'completed' : 'pending';
      arr[index].points = record.pointsEarned || 0;
      arr[index].isOnTime = record.isOnTime;
      arr[index].completedAt = record.completedAt;
      arr[index].note = record.note || '';
    }
    dateToQuestions.set(key, arr);
  });

  const rows = problemDates.map((entry) => ({
    date: entry._id,
    totalQuestions: entry.totalQuestions,
    completed: completionMap.get(entry._id)?.completed || 0,
    onTime: completionMap.get(entry._id)?.onTime || 0,
    late: completionMap.get(entry._id)?.late || 0,
    points: completionMap.get(entry._id)?.points || 0,
    questions: (dateToQuestions.get(entry._id) || []).map((question) => ({
      ...question,
      postedBy: question.studentId?.name || question.postedBy,
      student: question.studentId || null,
      points: Number(question.points) || 0,
      status: question.status || 'pending',
    })),
  }));

  return buildDailyProgressForStudent(rows);
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

module.exports = {
  buildStudentStatsSummary,
  buildDailyProgressForStudent,
  calculateCurrentStreak,
  getLeaderboard,
  getGroupStats,
  getStudentStats,
  getStudentDailyProgress,
  getStudentHistory,
};
