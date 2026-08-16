import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useActiveGroup } from '../hooks/useActiveGroup';
import Spinner from '../components/common/Spinner';
import { getRankEmoji } from '../utils/pointsHelpers';
import useLeaderboard from '../hooks/useLeaderboard';

const StudentsPage = () => {
  const { state, fetchStudents } = useApp();
  const { activeGroupId, isAdmin } = useActiveGroup();
  const { rankings, loading: rankLoading } = useLeaderboard(activeGroupId);

  // Re-fetch students scoped to the active group whenever it changes
  useEffect(() => {
    fetchStudents(isAdmin ? null : activeGroupId);
  }, [activeGroupId, isAdmin, fetchStudents]);

  const rankMap = new Map(rankings.map((r) => [r.student._id.toString(), r]));

  if (state.loading.students) return <Spinner text="Loading students..." />;

  // Admin sees all students; members see only their group-mates (scoped by backend)
  const students = state.students;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
        <h1>Students</h1>
        {!isAdmin && activeGroupId && (
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Showing group members only
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {students.map((student) => {
          const rankEntry = rankMap.get(student._id.toString());
          const target = activeGroupId ? `/groups/${activeGroupId}/students/${student._id}` : `/students/${student._id}`;
          return (
            <Link
              key={student._id}
              to={target}
              style={{ textDecoration: 'none' }}
            >
              <div className="card" style={{ cursor: 'pointer', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                <div className="flex items-center gap-4">
                  <div
                    className="avatar avatar-lg"
                    style={{ background: student.avatarColor || '#6c63ff' }}
                  >
                    {student.initials}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="font-bold" style={{ color: 'var(--text-primary)', marginBottom: 2 }}>
                      {student.name}
                    </div>
                    <div className="text-sm text-secondary">{student.email}</div>
                  </div>
                  {rankEntry && !rankLoading && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.3rem' }}>{getRankEmoji(rankEntry.rank)}</div>
                      <div
                        style={{
                          fontWeight: 700,
                          background: 'linear-gradient(135deg, var(--accent-light), var(--teal))',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }}
                      >
                        {rankEntry.totalPoints} pts
                      </div>
                    </div>
                  )}
                  <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>›</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {students.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <p>
            {isAdmin
              ? 'No students found.'
              : 'No group members found. Join a group to see your group-mates here.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentsPage;
