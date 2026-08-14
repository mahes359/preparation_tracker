// src/models/Problem.js

const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student ID is required'],
      index: true,
    },
    // Calendar date the problem belongs to (stored as UTC midnight)
    date: {
      type: Date,
      required: [true, 'Date is required'],
      index: true,
    },
    challengeDate: {
      type: String,
      required: [true, 'Challenge date is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Challenge date must be YYYY-MM-DD'],
      index: true,
    },
    leetcodeUrl: {
      type: String,
      required: [true, 'LeetCode URL is required'],
      trim: true,
      match: [
        /^https?:\/\/(www\.)?leetcode\.com\/problems\/.+/,
        'Please provide a valid LeetCode problem URL',
      ],
    },
    // Problem title — extracted from URL slug or entered manually
    title: {
      type: String,
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    // UTC timestamp when the on-time window closes for this problem
    deadline: {
      type: Date,
      required: true,
    },
    // Stub for future challenge types
    source: {
      type: String,
      enum: ['LeetCode', 'HackerRank', 'Custom'],
      default: 'LeetCode',
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for the most common query patterns
problemSchema.index({ date: 1, studentId: 1 });
problemSchema.index({ challengeDate: 1, studentId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Problem', problemSchema);
