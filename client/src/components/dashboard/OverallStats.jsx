// src/components/dashboard/OverallStats.jsx
// Summary stats widget showing overall group progress.

import { completionPercent } from '../../utils/pointsHelpers';

const OverallStats = ({ rankings }) => {
  if (!rankings || rankings.length === 0) return null;

  const totalCompleted = rankings.reduce((s, r) => s + r.completedCount, 0);
  const totalOnTime = rankings.reduce((s, r) => s + r.onTimeCount, 0);
  const totalLate = rankings.reduce((s, r) => s + r.lateCount, 0);
  const totalPoints = rankings.reduce((s, r) => s + r.totalPoints, 0);
  const totalProblems = totalCompleted + rankings.reduce((s, r) => s + (r.pendingCount || 0), 0);

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div className="card-header">
        <span className="card-title">Group Stats</span>
      </div>

      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-value">{totalCompleted}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-item">
          <div className="stat-value" style={{ fontSize: '1.4rem' }}>{totalPoints}</div>
          <div className="stat-label">Total Points</div>
        </div>
        <div className="stat-item">
          <div className="stat-value" style={{ color: 'var(--green)', WebkitTextFillColor: 'var(--green)' }}>
            {totalOnTime}
          </div>
          <div className="stat-label">On Time</div>
        </div>
        <div className="stat-item">
          <div className="stat-value" style={{ color: 'var(--orange)', WebkitTextFillColor: 'var(--orange)' }}>
            {totalLate}
          </div>
          <div className="stat-label">Late</div>
        </div>
      </div>

      {totalCompleted > 0 && (
        <div style={{ marginTop: 16 }}>
          <div className="flex justify-between text-xs text-muted" style={{ marginBottom: 6 }}>
            <span>On-time rate</span>
            <span>{completionPercent(totalOnTime, totalCompleted)}%</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${completionPercent(totalOnTime, totalCompleted)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default OverallStats;
