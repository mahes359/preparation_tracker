// src/models/ScoringConfig.js
// Only ONE document should have isActive = true at any time.
// Changing scoring rules = update this document (no code changes needed).

const mongoose = require('mongoose');

const scoringConfigSchema = new mongoose.Schema(
  {
    version: {
      type: Number,
      default: 1,
    },
    // Points awarded for completing before deadline
    onTimePoints: {
      type: Number,
      default: 10,
      min: [1, 'Points must be at least 1'],
    },
    // Points awarded for completing after deadline
    latePoints: {
      type: Number,
      default: 5,
      min: [0, 'Late points cannot be negative'],
    },
    // Local APP_TIMEZONE deadline clock time for the challenge date.
    deadlineHour: {
      type: Number,
      default: 23,
      min: 0,
      max: 23,
    },
    deadlineMinute: { type: Number, default: 59, min: 0, max: 59 },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    description: {
      type: String,
      default: 'Default scoring configuration',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ScoringConfig', scoringConfigSchema);
