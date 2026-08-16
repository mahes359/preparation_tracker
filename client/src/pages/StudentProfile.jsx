import { useEffect, useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentsApi } from '../services/api';
import Spinner from '../components/common/Spinner';
import { getRankEmoji } from '../utils/pointsHelpers';
import { formatDisplayDate } from '../utils/dateHelpers';

const StudentProfile = () => {
  const { studentId, groupId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedDay, setExpandedDay] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await studentsApi.getStats(studentId, groupId);
      setData(res.data);
      if (res.data?.dailyProgress?.length) {
        setExpandedDay((current) => current || res.data.dailyProgress[0].date);
      }
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

  useEffect(() => {
    const onRefresh = (event) => {
      const detailGroupId = event.detail?.groupId;
      if (!detailGroupId || !groupId || detailGroupId === groupId || !groupId) {
        fetchData();
      }
    };
    window.addEventListener('tracker:refresh', onRefresh);
    return () => window.removeEventListener('tracker:refresh', onRefresh);
  }, [fetchData, groupId]);

  if (loading) return <Spinner text="Loading profile..." />;
  if (error) return (
    <div className="empty-state">
      <div className="empty-icon">⚠️</div>
      <p>{error}</p>
      <button className="btn btn-outline btn-sm" style={{ marginTop: 16 }} onClick={() => navigate(-1)}>← Back</button>
    </div>
  );

  const { student, stats, rank, history = [], dailyProgress = [], currentStreak = 0, weeklySummary = {} } = data || {};
  const completionRate = stats?.completionRate ?? Math.round(((stats?.completedCount || 0) / Math.max(stats?.totalQuestions || 1, 1)) * 100);

  return (
    <div style={{ maxWidth: 980, margin: '0 auto' }}>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 20 }} onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="card" style={{ marginBottom: 20, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
        <div className="flex items-center gap-4">
          <div className="avatar avatar-lg" style={{ background: student.avatarColor || '#6c63ff' }}>{student.initials}</div>
          <div style={{ flex: 1 }}>
            <h1 style={{ marginBottom: 4 }}>{student.name}</h1>
            <div className="text-sm text-secondary">{student.email}</div>
            <div className="flex gap-2 mt-2" style={{ flexWrap: 'wrap' }}>
              <span className="badge badge-gray">{student.role || 'MEMBER'}</span>
              {groupId && <span className="badge badge-purple">Group scoped</span>}
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
          <div className="stat-item"><div className="stat-value">{stats.completedCount}</div><div className="stat-label">Questions Completed</div></div>
          <div className="stat-item"><div className="stat-value">{stats.pendingCount}</div><div className="stat-label">Questions Pending</div></div>
          <div className="stat-item"><div className="stat-value">{stats.totalPoints}</div><div className="stat-label">Total Points</div></div>
          <div className="stat-item"><div className="stat-value" style={{ color: 'var(--green)', WebkitTextFillColor: 'var(--green)' }}>{stats.onTimeCount}</div><div className="stat-label">On-Time</div></div>
          <div className="stat-item"><div className="stat-value" style={{ color: 'var(--orange)', WebkitTextFillColor: 'var(--orange)' }}>{stats.lateCount}</div><div className="stat-label">Late</div></div>
          <div className="stat-item"><div className="stat-value">{completionRate}%</div><div className="stat-label">Completion Rate</div></div>
          <div className="stat-item"><div className="stat-value">{currentStreak}</div><div className="stat-label">Current Streak</div></div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><span className="card-title">Daily Progress</span></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {dailyProgress.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px' }}><p>No challenge activity yet.</p></div>
          ) : (
            dailyProgress.map((day) => {
              const isOpen = expandedDay === day.date;
              return (
                <div key={day.date} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg-secondary)' }}>
                  <button
                    type="button"
                    onClick={() => setExpandedDay(isOpen ? null : day.date)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: 'transparent', color: 'var(--text-primary)', border: 'none', padding: '14px 16px',
                      cursor: 'pointer', textAlign: 'left'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700 }}>{formatDisplayDate(day.date)}</div>
                      <div className="text-xs text-muted">{day.completed} / {day.totalQuestions} completed</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: 'var(--accent-light)' }}>{day.completionRate}%</div>
                      <div className="text-xs text-muted">{day.points} pts</div>
                    </div>
                  </button>
                  {isOpen && (
                    <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <span>{day.totalQuestions} total questions</span>
                        <span>{day.pending} pending</span>
                        <span>{day.onTime} on time</span>
                        <span>{day.late} late</span>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <div className="progress-bar"><div className="progress-fill" style={{ width: `${day.completionRate}%` }} /></div>
                      </div>
                      {(day.questions || []).length === 0 ? (
                        <div className="text-sm text-muted">No question details available for this day.</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {(day.questions || []).map((question) => {
                            const isDone = question.status === 'completed';
                            return (
                              <div key={question._id || `${day.date}-${question.title}`} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', background: 'rgba(255,255,255,0.01)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                                  <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                                    {isDone ? '✓' : '○'} {question.title || 'Problem'}
                                  </div>
                                  <span className={`badge ${isDone ? 'badge-green' : 'badge-gray'}`}>{isDone ? 'Completed' : 'Pending'}</span>
                                </div>
                                <div className="text-xs text-muted" style={{ marginTop: 6 }}>
                                  Posted by: {question.postedBy || question.student?.name || 'Unknown'}
                                </div>
                                <div className="text-xs text-muted" style={{ marginTop: 3 }}>
                                  {question.points || 0} pts · {question.isOnTime === false ? 'Late' : (question.isOnTime === true ? 'On Time' : 'Pending')}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><span className="card-title">Weekly Summary</span></div>
        <div className="stats-grid">
          <div className="stat-item"><div className="stat-value">{weeklySummary.completionRate ?? 0}%</div><div className="stat-label">Completion Rate</div></div>
          <div className="stat-item"><div className="stat-value">{weeklySummary.questionsSolved ?? 0}</div><div className="stat-label">Questions Solved</div></div>
          <div className="stat-item"><div className="stat-value" style={{ color: 'var(--green)', WebkitTextFillColor: 'var(--green)' }}>{weeklySummary.onTime ?? 0}</div><div className="stat-label">On Time</div></div>
          <div className="stat-item"><div className="stat-value" style={{ color: 'var(--orange)', WebkitTextFillColor: 'var(--orange)' }}>{weeklySummary.late ?? 0}</div><div className="stat-label">Late</div></div>
          <div className="stat-item"><div className="stat-value">{weeklySummary.points ?? 0}</div><div className="stat-label">Points</div></div>
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
                <div className="text-xs text-muted" style={{ minWidth: 76 }}>{formatDisplayDate(problem.date)}</div>
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
