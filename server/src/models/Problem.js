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
    completedAt: {
      type: Date,
      default: null,
    },
    isCompleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    // true if completed before deadline
    isOnTime: {
      type: Boolean,
      default: null, // null = not yet completed
    },
    // Points stored on completion so re-reads are cheap
    pointsEarned: {
      type: Number,
      default: 0,
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
problemSchema.index({ studentId: 1, isCompleted: 1 });
problemSchema.index({ date: 1, isCompleted: 1 });

module.exports = mongoose.model('Problem', problemSchema);
