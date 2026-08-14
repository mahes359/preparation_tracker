import { useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { studentsApi } from '../services/api';
import Spinner from '../components/common/Spinner';
import { getRankEmoji, completionPercent } from '../utils/pointsHelpers';
import { formatDisplayDate } from '../utils/dateHelpers';

const StudentProfile = () => {
  const { studentId, groupId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await studentsApi.getStats(studentId, groupId);
      setData(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [studentId, groupId]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) return <Spinner text="Loading profile..." />;
  if (error) return (
    <div className="empty-state">
      <div className="empty-icon">⚠️</div>
      <p>{error}</p>
      <button className="btn btn-outline btn-sm" style={{ marginTop: 16 }} onClick={() => navigate(-1)}>← Back</button>
    </div>
  );

  const { student, stats, rank, history } = data;
  const completionRate = completionPercent(stats.completedCount, stats.questionsPosted || 1);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 20 }} onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="flex items-center gap-4">
          <div className="avatar avatar-lg" style={{ background: student.avatarColor || '#6c63ff' }}>{student.initials}</div>
          <div style={{ flex: 1 }}>
            <h1 style={{ marginBottom: 4 }}>{student.name}</h1>
            <div className="text-sm text-secondary">{student.email}</div>
            <div className="flex gap-2 mt-2" style={{ flexWrap: 'wrap' }}>
              <span className="badge badge-gray">{student.role || 'MEMBER'}</span>
            </div>
          </div>
          {rank && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem' }}>{getRankEmoji(rank)}</div>
              <div className="text-xs text-muted">Rank #{rank}</div>
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><span className="card-title">Statistics</span></div>
        <div className="stats-grid">
          <div className="stat-item"><div className="stat-value">{stats.questionsPosted}</div><div className="stat-label">Questions Posted</div></div>
          <div className="stat-item"><div className="stat-value">{stats.completedCount}</div><div className="stat-label">Completed</div></div>
          <div className="stat-item"><div className="stat-value">{stats.pendingCount}</div><div className="stat-label">Pending</div></div>
          <div className="stat-item"><div className="stat-value">{stats.totalPoints}</div><div className="stat-label">Total Points</div></div>
          <div className="stat-item"><div className="stat-value" style={{ color: 'var(--green)', WebkitTextFillColor: 'var(--green)' }}>{stats.onTimeCount}</div><div className="stat-label">On-Time</div></div>
          <div className="stat-item"><div className="stat-value" style={{ color: 'var(--orange)', WebkitTextFillColor: 'var(--orange)' }}>{stats.lateCount}</div><div className="stat-label">Late</div></div>
          <div className="stat-item"><div className="stat-value">{completionRate}%</div><div className="stat-label">Completion Rate</div></div>
          <div className="stat-item"><div className="stat-value">#{rank || '—'}</div><div className="stat-label">Current Rank</div></div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Recent Activity</span></div>
        {history.length === 0 ? (
          <div className="empty-state" style={{ padding: '24px' }}><p>No recent activity.</p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {history.map((problem) => (
              <div key={problem._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px', borderRadius: 'var(--radius-sm)' }}>
                <div className="text-xs text-muted" style={{ minWidth: 70 }}>{formatDisplayDate(problem.date)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <a href={problem.leetcodeUrl} target="_blank" rel="noopener noreferrer" className="text-sm" style={{ color: 'var(--text-primary)' }}>
                    {problem.title || 'Problem'}
                  </a>
                </div>
                <span className="badge badge-green">✓ Completed</span>
                <span className="badge badge-purple">+{problem.pointsEarned || 0} pts</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentProfile;
