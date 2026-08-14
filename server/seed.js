// seed.js — Populates the database with initial data.
// Run: npm run seed

require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('./src/models/Student');
const ScoringConfig = require('./src/models/ScoringConfig');
const env = require('./src/config/env');

const AVATAR_COLORS = ['#6c63ff', '#f64f59', '#11998e'];

// const STUDENTS = [
//   { name: 'Alice Johnson', email: 'alice@example.com', avatarColor: AVATAR_COLORS[0] },
//   { name: 'Bob Smith', email: 'bob@example.com', avatarColor: AVATAR_COLORS[1] },
//   { name: 'Charlie Davis', email: 'charlie@example.com', avatarColor: AVATAR_COLORS[2] },
// ];
const STUDENTS = [];

const seed = async () => {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log('✅  Connected to MongoDB');
    await Student.syncIndexes();
    // Clear existing data
    await Student.deleteMany({});
    await ScoringConfig.deleteMany({});
    console.log('🗑️   Cleared existing data');

    // Create students
    const students = await Student.insertMany(STUDENTS);
    console.log(`👥  Created ${students.length} students:`);
    students.forEach((s) => console.log(`     - ${s.name} (${s.email})`));

    // Create default scoring config
    await ScoringConfig.create({
      onTimePoints: 10,
      latePoints: 5,
      deadlineHourUTC: 18, // 11:30 PM IST
      description: 'Default config — 10 pts on-time, 5 pts late',
      isActive: true,
    });
    console.log('⚙️   Created default scoring configuration');
    console.log('\n✅  Seed complete! Run "npm run dev" to start the server.');
  } catch (err) {
    console.error('❌  Seed failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

seed();
