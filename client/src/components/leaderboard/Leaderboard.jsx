import { Link, useParams } from 'react-router-dom';
import Spinner from '../common/Spinner';
import { getRankClass } from '../../utils/pointsHelpers';

const RANK_MEDALS = { 1: '1', 2: '2', 3: '3' };

const Leaderboard = ({ rankings, loading, error, onRefresh, groupId }) => {
  const params = useParams();
  const gid = groupId || params.groupId;
  return (
  <div>
    <div className="card-header">
      <span className="card-title">Leaderboard</span>
      <button className="btn btn-ghost btn-sm" onClick={onRefresh} title="Refresh leaderboard" style={{ fontSize: '1rem', padding: '4px 8px' }}>↻</button>
    </div>
    {loading && <Spinner size="sm" />}
    {error && <p className="text-sm text-muted">{error}</p>}
    {!loading && !error && rankings.length === 0 && <div className="empty-state" style={{ padding: '24px' }}><p className="text-sm">No students found.</p></div>}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {rankings.map((entry) => (
        <Link key={entry.student._id} to={gid ? `/groups/${gid}/students/${entry.student._id}` : `/my-groups`} style={{ textDecoration: 'none' }}>
          <div className="leaderboard-item">
            <div className={`rank-badge ${getRankClass(entry.rank)}`}>{RANK_MEDALS[entry.rank] || entry.rank}</div>
            <div className="avatar avatar-sm" style={{ background: entry.student.avatarColor || '#6c63ff' }}>{entry.student.initials || '?'}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{entry.student.name}</div>
              <div className="text-xs text-muted" style={{ marginTop: 1 }}>Completed {entry.completedCount} · {entry.onTimeCount} on-time · {entry.lateCount} late</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--accent-light)' }}>{entry.totalPoints}</div>
              <div className="text-xs text-muted">pts</div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  </div>
  );
};

export default Leaderboard;
