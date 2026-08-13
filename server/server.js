// server.js — Entry point

const app = require('./src/app');
const connectDB = require('./src/config/db');
const env = require('./src/config/env');
const { registerDeadlineJob } = require('./src/jobs/dailyDeadline.job');

const start = async () => {
  await connectDB();

  app.listen(env.PORT, () => {
    console.log(`🚀  Server running on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
  });

  // Register background jobs after server is up
  registerDeadlineJob();
};

start();
