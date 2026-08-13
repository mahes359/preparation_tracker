# 🎯 Interview Prep Tracker

> A clean, minimal **MERN stack** web application for tracking daily LeetCode problems, earning points, and competing on a leaderboard with your study group.

---

## ✨ Features

- 📅 **Daily Problem Tracking** — Each student posts 1 LeetCode problem per day
- 🔗 **Direct LeetCode Links** — Open problems directly from the app
- ✅ **One-click Completion** — Checkbox marks problems complete and awards points instantly
- ⏰ **On-time / Late Detection** — Full points for on-time, reduced points for late
- 🏆 **Live Leaderboard** — Real-time rankings by total points, updated on every completion
- 📊 **Student Profiles** — Individual stats, completion rates, and 30-day problem history
- ⚙️ **Configurable Scoring** — Change point rules in the DB without any code changes
- 🌙 **Dark Theme UI** — Premium dark design with purple/teal gradient accents

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Routing | React Router v6 |
| HTTP Client | Axios |
| Styling | Vanilla CSS (design system with CSS variables) |
| Backend | Node.js 20 + Express 4 |
| Validation | Zod |
| Database | MongoDB + Mongoose 8 |
| Scheduling | node-cron |
| Dev tooling | Nodemon, Concurrently |

---

## 📁 Project Structure

```
interview-prep-tracker/
├── package.json              ← Root: runs both server + client concurrently
│
├── server/                   ← Express API
│   ├── server.js             ← Entry point
│   ├── seed.js               ← Database seeder (3 students + config)
│   ├── .env.example          ← Environment variable template
│   ├── package.json
│   └── src/
│       ├── app.js            ← Express app setup (no listen)
│       ├── config/
│       │   ├── db.js         ← MongoDB connection
│       │   └── env.js        ← Centralised env vars
│       ├── models/
│       │   ├── Student.js
│       │   ├── Problem.js    ← With compound indexes
│       │   └── ScoringConfig.js
│       ├── routes/
│       │   ├── index.js      ← Mounts all routers at /api/v1
│       │   ├── students.routes.js
│       │   ├── problems.routes.js
│       │   ├── leaderboard.routes.js
│       │   └── config.routes.js
│       ├── controllers/
│       │   ├── students.controller.js
│       │   ├── problems.controller.js
│       │   ├── leaderboard.controller.js
│       │   └── config.controller.js
│       ├── services/
│       │   ├── scoring.service.js     ← Points calculation logic
│       │   ├── problem.service.js     ← Problem business logic
│       │   └── leaderboard.service.js ← Aggregation pipeline
│       ├── middleware/
│       │   ├── asyncHandler.js
│       │   ├── errorHandler.js
│       │   └── validate.js
│       ├── jobs/
│       │   └── dailyDeadline.job.js   ← node-cron midnight job
│       └── utils/
│           └── dateUtils.js
│
└── client/                   ← React SPA
    ├── index.html
    ├── vite.config.js         ← Proxies /api → localhost:5000
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx             ← Routes + providers
        ├── index.css           ← Full design system
        ├── pages/
        │   ├── Dashboard.jsx
        │   ├── StudentsPage.jsx
        │   └── StudentProfile.jsx
        ├── components/
        │   ├── layout/Header.jsx
        │   ├── dashboard/
        │   │   ├── TodayProblems.jsx
        │   │   ├── ProblemCard.jsx
        │   │   ├── AddProblemModal.jsx
        │   │   ├── DaySelector.jsx
        │   │   └── OverallStats.jsx
        │   ├── leaderboard/Leaderboard.jsx
        │   └── common/
        │       ├── Spinner.jsx
        │       ├── Badge.jsx
        │       ├── StatusChip.jsx
        │       └── Toast.jsx
        ├── context/AppContext.jsx
        ├── services/api.js
        ├── hooks/
        │   ├── useProblems.js
        │   └── useLeaderboard.js
        └── utils/
            ├── dateHelpers.js
            └── pointsHelpers.js
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+ — [nodejs.org](https://nodejs.org)
- **MongoDB** — Local install or [MongoDB Atlas](https://www.mongodb.com/atlas) (free M0 tier)

---

### 1. Install All Dependencies

```bash
cd e:\PROJECT\EXAMPLE

# Install root + server + client dependencies
npm run install:all
```

---

### 2. Configure Environment

```bash
# Copy the example file
copy server\.env.example server\.env
```

Edit `server/.env`:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/interview-tracker
CLIENT_URL=http://localhost:5173
DEADLINE_HOUR_UTC=18
```

> **Deadline logic:** `DEADLINE_HOUR_UTC=18` means problems must be completed before 18:59:59 UTC, which is **11:30 PM IST** (UTC+5:30).

> **Using MongoDB Atlas?** Replace `MONGO_URI` with your Atlas connection string:
> ```
> MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/interview-tracker
> ```

---

### 3. Seed the Database

```bash
npm run seed
```

This creates:
- **3 students**: Alice Johnson, Bob Smith, Charlie Davis
- **Default scoring config**: 10 pts on-time, 5 pts late

---

### 4. Start Development Servers

```bash
npm run dev
```

Both servers start concurrently:

| Server | URL |
|---|---|
| React client | http://localhost:5173 |
| Express API | http://localhost:5000 |
| API health check | http://localhost:5000/api/v1/health |

---

## 📡 API Reference

**Base URL:** `/api/v1`

### Students

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/students` | List all active students |
| `POST` | `/students` | Create a student |
| `GET` | `/students/:id` | Get student by ID |
| `PUT` | `/students/:id` | Update student |
| `DELETE` | `/students/:id` | Soft-delete (sets isActive=false) |
| `GET` | `/students/:id/stats` | Stats + rank + 30-day history |

### Problems

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/problems?date=YYYY-MM-DD` | Problems for a date (today if omitted) |
| `POST` | `/problems` | Post a new LeetCode problem |
| `GET` | `/problems/:id` | Get single problem |
| `PATCH` | `/problems/:id/complete` | Mark complete → awards points instantly |
| `DELETE` | `/problems/:id` | Delete (only uncompleted) |

**POST `/problems` example body:**
```json
{
  "studentId": "64abc123...",
  "leetcodeUrl": "https://leetcode.com/problems/two-sum/",
  "date": "2026-08-13"
}
```

**PATCH `/problems/:id/complete` response:**
```json
{
  "success": true,
  "data": { "...updated problem..." },
  "pointsEarned": 10,
  "isOnTime": true
}
```

### Leaderboard

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/leaderboard` | All-time ranked leaderboard |

### Scoring Config

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/config/scoring` | Get active scoring config |
| `PUT` | `/config/scoring` | Update scoring rules (no code deploy needed) |

---

## ⚙️ Scoring Logic

```
On-time completion  →  Full points  (default: 10)
Late completion     →  Reduced pts  (default: 5)
No completion       →  0 points
```

**"On-time"** = completed before `deadlineHourUTC:59:59 UTC` on the same day the problem was posted.

### Changing Scoring Rules (No Code Deploy Needed)

```bash
curl -X PUT http://localhost:5000/api/v1/config/scoring \
  -H "Content-Type: application/json" \
  -d '{"onTimePoints": 15, "latePoints": 7, "deadlineHourUTC": 16}'
```

### Ranking Tiebreaker

1. Total Points (DESC)
2. On-time Count (DESC)
3. Completed Count (DESC)
4. Name (ASC)

---

## 🌐 Deployment (Free Tier)

| Component | Service |
|---|---|
| Frontend | [Vercel](https://vercel.com) — deploy `client/` folder |
| Backend | [Railway](https://railway.app) — deploy `server/` folder |
| Database | [MongoDB Atlas M0](https://www.mongodb.com/atlas) — free 512MB |

### Steps

1. **MongoDB Atlas** — Create free cluster, add DB user, whitelist `0.0.0.0/0`
2. **Railway** — Connect GitHub repo, set root to `server/`, add env vars
3. **Vercel** — Connect GitHub repo, set root to `client/`, add `VITE_API_URL=<your-railway-url>/api/v1`

---

## 🔮 Future Roadmap

| Feature | Status |
|---|---|
| JWT Auth + roles (student/admin) | Planned Phase 3 |
| Groups / Teams (groupId already stubbed) | Planned Phase 3 |
| Weekly/monthly leaderboard snapshots | Planned Phase 3 |
| Email deadline reminders | Planned Phase 3 |
| Non-LeetCode challenge types | Planned Phase 3 |

---

## 📐 Key Architecture Decisions

| Decision | Rationale |
|---|---|
| **Modular monolith** | 3 users, no justification for microservices |
| **Points stored on write** | Avoids recalculation; cheap reads |
| **Config-driven scoring** | Change rules in DB, zero code changes |
| **`/api/v1` prefix** | Zero-cost versioning from day one |
| **`app.js` + `server.js` split** | Importable in tests without port binding |
| **`groupId` stubbed on models** | Adding teams = zero schema migration |

---

## 📜 License

MIT — free to use, modify, and extend.

---

*Designed for 3 students · Architected for 300.*
