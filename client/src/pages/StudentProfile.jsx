// src/pages/StudentProfile.jsx
// Individual student profile with stats and problem history.

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { studentsApi } from '../services/api';
import Spinner from '../components/common/Spinner';
import StatusChip from '../components/common/StatusChip';
import { getRankEmoji, completionPercent } from '../utils/pointsHelpers';
import { formatDisplayDate } from '../utils/dateHelpers';

const StudentProfile = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await studentsApi.getStats(id);
        setData(res.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <Spinner text="Loading profile..." />;
  if (error) return (
    <div className="empty-state">
      <div className="empty-icon">⚠️</div>
      <p>{error}</p>
      <Link to="/" className="btn btn-outline btn-sm" style={{ marginTop: 16 }}>← Back to Dashboard</Link>
    </div>
  );

  const { student, stats, rank, history } = data;
  const onTimeRate = completionPercent(stats.onTimeCount, stats.completedCount);

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* Back nav */}
      <Link to="/" className="btn btn-ghost btn-sm" style={{ marginBottom: 20 }}>
        ← Dashboard
      </Link>

      {/* Profile header */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="flex items-center gap-4">
          <div
            className="avatar avatar-lg"
            style={{ background: student.avatarColor || '#6c63ff' }}
          >
            {student.initials}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ marginBottom: 4 }}>{student.name}</h1>
            <p style={{ fontSize: '0.875rem', margin: 0 }}>{student.email}</p>
          </div>
          {rank && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem' }}>{getRankEmoji(rank)}</div>
              <div className="text-xs text-muted">Rank #{rank}</div>
            </div>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><span className="card-title">Statistics</span></div>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">{stats.totalPoints}</div>
            <div className="stat-label">Total Points</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{stats.completedCount}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-item">
            <div
              className="stat-value"
              style={{ color: 'var(--green)', WebkitTextFillColor: 'var(--green)' }}
            >
              {stats.onTimeCount}
            </div>
            <div className="stat-label">On Time</div>
          </div>
          <div className="stat-item">
            <div
              className="stat-value"
              style={{ color: 'var(--orange)', WebkitTextFillColor: 'var(--orange)' }}
            >
              {stats.lateCount}
            </div>
            <div className="stat-label">Late</div>
          </div>
        </div>

        {stats.completedCount > 0 && (
          <div style={{ marginTop: 16 }}>
            <div className="flex justify-between text-xs text-muted" style={{ marginBottom: 6 }}>
              <span>On-time rate</span>
              <span className="text-green">{onTimeRate}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${onTimeRate}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Problem history */}
      <div className="card">
        <div className="card-header"><span className="card-title">Recent Problems</span></div>

        {history.length === 0 ? (
          <div className="empty-state" style={{ padding: '24px' }}>
            <p>No problems submitted yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {history.map((problem) => (
              <div
                key={problem._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 8px',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'background var(--transition)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div className="text-xs text-muted" style={{ minWidth: 80 }}>
                  {formatDisplayDate(problem.date)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <a
                    href={problem.leetcodeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm truncate"
                    style={{ color: 'var(--text-primary)', display: 'block' }}
                  >
                    {problem.title || 'Problem'}
                  </a>
                </div>
                <StatusChip problem={problem} />
                {problem.isCompleted && (
                  <span className="badge badge-purple">+{problem.pointsEarned}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentProfile;
