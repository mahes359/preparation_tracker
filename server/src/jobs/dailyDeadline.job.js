// src/jobs/dailyDeadline.job.js
// Runs at midnight UTC every day to mark overdue pending problems.
// This ensures students with no completion by deadline don't stay "pending" forever.

const cron = require('node-cron');
const Problem = require('../models/Problem');

const runDeadlineJob = async () => {
  const now = new Date();
  console.log(`[DeadlineJob] Running at ${now.toISOString()}`);

  try {
    // Find all pending problems whose deadline has passed
    const result = await Problem.updateMany(
      {
        isCompleted: false,
        deadline: { $lt: now },
      },
      {
        // Leave isCompleted: false so they show as "missed" (0 points)
        // We only need to ensure pointsEarned stays 0 (it's already the default)
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`[DeadlineJob] Processed ${result.modifiedCount} overdue problems`);
    } else {
      console.log('[DeadlineJob] No overdue problems found');
    }
  } catch (err) {
    console.error('[DeadlineJob] Error:', err.message);
  }
};

/**
 * Registers the daily deadline cron job.
 * Runs at 00:01 UTC every day (1 minute after midnight UTC).
 */
const registerDeadlineJob = () => {
  // '1 0 * * *' = 00:01 UTC daily
  cron.schedule('1 0 * * *', runDeadlineJob, {
    timezone: 'UTC',
  });
  console.log('⏰  Daily deadline job scheduled (runs at 00:01 UTC)');
};

module.exports = { registerDeadlineJob };
