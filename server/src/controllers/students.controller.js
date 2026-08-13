// src/controllers/students.controller.js

const Student = require('../models/Student');
const asyncHandler = require('../middleware/asyncHandler');
const { getStudentStats, getStudentHistory, getLeaderboard } = require('../services/leaderboard.service');

const getStudents = asyncHandler(async (req, res) => {
  const students = await Student.find({ isActive: true }).lean({ virtuals: true });
  res.json({ success: true, data: students });
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

  // Verify student exists
  const student = await Student.findById(id).lean({ virtuals: true });
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

  const [stats, history, leaderboard] = await Promise.all([
    getStudentStats(id),
    getStudentHistory(id, 30),
    getLeaderboard(),
  ]);

  const rankEntry = leaderboard.find((r) => r.student._id.toString() === id);
  const rank = rankEntry ? rankEntry.rank : null;

  res.json({ success: true, data: { student, stats, rank, history } });
});

module.exports = { getStudents, getStudent, createStudent, updateStudent, deleteStudent, getStudentStatsHandler };
