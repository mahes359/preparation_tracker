// src/pages/Dashboard.jsx
// Main dashboard page: problems (left) + leaderboard & stats (right).

import { SignedOut, SignInButton } from '@clerk/clerk-react';
import TodayProblems from '../components/dashboard/TodayProblems';
import Leaderboard from '../components/leaderboard/Leaderboard';
import OverallStats from '../components/dashboard/OverallStats';
import useLeaderboard from '../hooks/useLeaderboard';

const Dashboard = () => {
  const { rankings, groupStats, loading: leaderboardLoading, error: leaderboardError, refetch: refetchLeaderboard } = useLeaderboard();

  const handleProblemComplete = () => {
    refetchLeaderboard();
  };

  return (
    <div>
      {/* Sign-in call-to-action banner — shown only when signed out */}
      <SignedOut>
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(14,165,233,0.08))',
            border: '1px solid rgba(124,58,237,0.25)',
            borderRadius: 'var(--radius)',
            padding: '14px 20px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>🎯</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
              Track your own progress
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Sign in to add your daily problem, mark it complete, and earn points.
              Your account links automatically to your student record.
            </div>
          </div>
          <SignInButton mode="modal">
            <button id="dashboard-sign-in-btn" className="btn btn-primary btn-sm">
              Sign In Free
            </button>
          </SignInButton>
        </div>
      </SignedOut>

      <div className="dashboard-grid">
        {/* Left: Problems */}
        <div className="card">
          <TodayProblems onProblemComplete={handleProblemComplete} />
        </div>

        {/* Right: Leaderboard + Stats */}
        <div>
          <div className="card">
            <Leaderboard rankings={rankings} loading={leaderboardLoading} error={leaderboardError} onRefresh={refetchLeaderboard} />
          </div>
          <OverallStats groupStats={groupStats} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
