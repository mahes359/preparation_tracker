const mongoose = require('mongoose');

const completionSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true, index: true },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null, index: true },
  challengeDate: { type: String, required: true, match: [/^\d{4}-\d{2}-\d{2}$/, 'Challenge date must be YYYY-MM-DD'], index: true },
  status: { type: String, enum: ['pending', 'completed'], default: 'pending', index: true },
  note: { type: String, trim: true, maxlength: 2000, default: '' },
  completedAt: { type: Date, default: null },
  isOnTime: { type: Boolean, default: null },
  pointsEarned: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

completionSchema.index({ studentId: 1, problemId: 1 }, { unique: true });
completionSchema.index({ studentId: 1, groupId: 1, challengeDate: 1 });
completionSchema.index({ groupId: 1, challengeDate: 1 });
completionSchema.index({ studentId: 1, challengeDate: 1 });

module.exports = mongoose.model('Completion', completionSchema);
