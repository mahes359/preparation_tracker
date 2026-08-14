// src/jobs/dailyDeadline.job.js
// Runs at midnight UTC every day to log overdue pending completions.

const cron = require('node-cron');
const Completion = require('../models/Completion');
const Problem = require('../models/Problem');

const runDeadlineJob = async () => {
  const now = new Date();
  console.log(`[DeadlineJob] Running at ${now.toISOString()}`);

  try {
    // Find problems whose deadline has passed
    const overdueProblems = await Problem.find({ deadline: { $lt: now } }).select('_id').lean();
    if (overdueProblems.length === 0) {
      console.log('[DeadlineJob] No overdue problems found');
      return;
    }

    const overdueIds = overdueProblems.map((p) => p._id);

    // Count pending completions for overdue problems (students who never completed)
    const pendingCount = await Completion.countDocuments({
      problemId: { $in: overdueIds },
      status: 'pending',
      completedAt: null,
    });

    console.log(`[DeadlineJob] ${overdueProblems.length} overdue problems, ${pendingCount} pending completions (0 pts)`);
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
