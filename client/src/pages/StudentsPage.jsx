// src/pages/StudentsPage.jsx
// Lists all students with links to their profiles.

import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Spinner from '../components/common/Spinner';
import { getRankEmoji } from '../utils/pointsHelpers';
import useLeaderboard from '../hooks/useLeaderboard';

const StudentsPage = () => {
  const { state } = useApp();
  const { rankings, loading: rankLoading } = useLeaderboard();

  const rankMap = new Map(rankings.map((r) => [r.student._id.toString(), r]));

  if (state.loading.students) return <Spinner text="Loading students..." />;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
        <h1>Students</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {state.students.map((student) => {
          const rankEntry = rankMap.get(student._id.toString());
          return (
            <Link
              key={student._id}
              to={`/students/${student._id}`}
              style={{ textDecoration: 'none' }}
            >
              <div className="card" style={{ cursor: 'pointer' }}>
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

      {state.students.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <p>No students found. Run the seed script to add initial students.</p>
        </div>
      )}
    </div>
  );
};

export default StudentsPage;
