// src/models/ScoringConfig.js
const mongoose = require('mongoose');

const scoringConfigSchema = new mongoose.Schema(
  {
    version: { type: Number, default: 2 },

    // Position-based on-time points (within deadline, same day)
    firstPoints:    { type: Number, default: 15, min: 1 },  // 1st to complete in group
    secondPoints:   { type: Number, default: 12, min: 1 },  // 2nd to complete
    standardPoints: { type: Number, default: 10, min: 1 },  // 3rd+ on-time

    // Late points (after deadline)
    lateSameDayPoints: { type: Number, default: 6, min: 0 }, // same calendar day, after deadline
    lateOneDayPoints:  { type: Number, default: 3, min: 0 }, // 1 day after challenge date
    lateTwoPlusDayPoints: { type: Number, default: 1, min: 0 }, // 2+ days after challenge date

    // Deadline: hour + minute in APP_TIMEZONE
    deadlineHour:   { type: Number, default: 23, min: 0, max: 23 },
    deadlineMinute: { type: Number, default: 59, min: 0, max: 59 },

    isActive:    { type: Boolean, default: true, index: true },
    description: { type: String, default: 'Position + lateness based scoring', trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ScoringConfig', scoringConfigSchema);
