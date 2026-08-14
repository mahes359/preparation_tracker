// server.js — Entry point

const app = require('./src/app');
const connectDB = require('./src/config/db');
const env = require('./src/config/env');
const { registerDeadlineJob } = require('./src/jobs/dailyDeadline.job');
const ScoringConfig = require('./src/models/ScoringConfig');

// Migrate old scoring config to new position-based schema if needed
const migrateScoring = async () => {
  const config = await ScoringConfig.findOne({ isActive: true });
  if (!config) {
    await ScoringConfig.create({
      firstPoints: 15, secondPoints: 12, standardPoints: 10,
      lateSameDayPoints: 6, lateOneDayPoints: 3, lateTwoPlusDayPoints: 1,
      deadlineHour: 23, deadlineMinute: 59,
      description: 'Position-based: 1st=15, 2nd=12, 3rd+=10 | Late: same-day=6, 1-day=3, 2+days=1',
      isActive: true,
    });
    console.log('\u2699\ufe0f  Scoring config created (position-based)');
  } else if (!config.firstPoints) {
    // Old schema — upgrade in place
    config.firstPoints = 15;
    config.secondPoints = 12;
    config.standardPoints = config.onTimePoints || 10;
    config.lateSameDayPoints = 6;
    config.lateOneDayPoints = 3;
    config.lateTwoPlusDayPoints = 1;
    config.description = 'Position-based: 1st=15, 2nd=12, 3rd+=10 | Late: same-day=6, 1-day=3, 2+days=1';
    await config.save();
    console.log('\u2699\ufe0f  Scoring config migrated to position-based schema');
  }
};

const start = async () => {
  await connectDB();
  await migrateScoring();

  app.listen(env.PORT, () => {
    console.log(`\ud83d\ude80  Server running on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
  });

  registerDeadlineJob();
};

start();
