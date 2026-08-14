// seed.js — Populates the database with initial data.
// Run: npm run seed

require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('./src/models/Student');
const ScoringConfig = require('./src/models/ScoringConfig');
const env = require('./src/config/env');

const STUDENTS = [];

const seed = async () => {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log('✅  Connected to MongoDB');
    await Student.syncIndexes();

    await Student.deleteMany({});
    await ScoringConfig.deleteMany({});
    console.log('🗑️   Cleared existing data');

    const students = await Student.insertMany(STUDENTS);
    console.log(`👥  Created ${students.length} students`);

    await ScoringConfig.create({
      firstPoints: 15,
      secondPoints: 12,
      standardPoints: 10,
      lateSameDayPoints: 6,
      lateOneDayPoints: 3,
      lateTwoPlusDayPoints: 1,
      deadlineHour: 23,
      deadlineMinute: 59,
      description: 'Position-based: 1st=15, 2nd=12, 3rd+=10 | Late: same-day=6, 1-day=3, 2+days=1',
      isActive: true,
    });
    console.log('⚙️   Created position-based scoring configuration');
    console.log('\n✅  Seed complete! Run "npm run dev" to start the server.');
  } catch (err) {
    console.error('❌  Seed failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

seed();
