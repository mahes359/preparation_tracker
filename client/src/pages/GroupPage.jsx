import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../context/AppContext';
import { groupsApi } from '../services/api';
import TodayProblems from '../components/dashboard/TodayProblems';
import Leaderboard from '../components/leaderboard/Leaderboard';
import OverallStats from '../components/dashboard/OverallStats';
import Spinner from '../components/common/Spinner';
import useLeaderboard from '../hooks/useLeaderboard';
import { getRankEmoji } from '../utils/pointsHelpers';

const TABS = ['Dashboard', 'Students', 'Members'];

const GroupPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { state, addToast, fetchUserGroups } = useApp();
  const { isSignedIn } = useAuth();
  const [tab, setTab] = useState('Dashboard');
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const currentStudent = state.currentStudent;
  const isAdmin = currentStudent?.role === 'ADMIN';
  const membership = state.memberships.find(
    (m) => m.status === 'ACTIVE' && m.groupId?.toString() === groupId
  );
  const isCreator = membership?.role === 'CREATOR' || isAdmin;

  const { rankings, groupStats, loading: lbLoading, error: lbError, refetch: refetchLeaderboard } = useLeaderboard(groupId);

  const loadGroup = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await groupsApi.getById(groupId);
      setGroup(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => { loadGroup(); }, [loadGroup]);

  const handleKick = async (memberId, memberName) => {
    if (!window.confirm(`Remove ${memberName} from this group?`)) return;
    try {
      await groupsApi.removeMember(groupId, memberId);
      addToast(`${memberName} removed`, 'success');
      await loadGroup();
      await fetchUserGroups(groupId);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleLeave = async () => {
    if (!window.confirm('Are you sure you want to leave this group?')) return;
    try {
      await groupsApi.leaveGroup(groupId);
      addToast('You have left the group', 'info');
      await fetchUserGroups(null);
      navigate('/my-groups', { replace: true });
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  if (loading) return <Spinner text="Loading group..." />;
  if (error) return (
    <div className="empty-state">
      <p>{error}</p>
      <button className="btn btn-outline btn-sm" style={{ marginTop: 16 }} onClick={() => navigate('/my-groups')}>← Back</button>
    </div>
  );

  const members = group?.members || [];
  const creatorId = group?.createdBy?._id?.toString() || group?.createdBy?.toString();

  return (
    <div style={{ maxWidth: 980, margin: '0 auto' }}>
      {/* Back + header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/my-groups')}>← Back</button>
        <div style={{ flex: 1 }}>
          <h1 style={{ marginBottom: 2, fontSize: '1.3rem' }}>{group?.name}</h1>
          {group?.description && <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{group.description}</div>}
        </div>
        <span className="badge badge-green">{members.length} members</span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '8px 18px', fontWeight: 600, fontSize: '0.9rem',
              color: tab === t ? 'var(--accent-light)' : 'var(--text-muted)',
              borderBottom: tab === t ? '2px solid var(--accent-light)' : '2px solid transparent',
              marginBottom: -1, transition: 'color 0.15s',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Dashboard tab */}
      {tab === 'Dashboard' && (
        <div>
          {/* Scoring legend */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20,
            padding: '10px 14px', borderRadius: 'var(--radius-sm)',
            background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)',
            fontSize: '0.78rem', color: 'var(--text-secondary)',
          }}>
            <span style={{ fontWeight: 600, color: 'var(--text-muted)', marginRight: 4 }}>Points:</span>
            <span>🥇 1st = <strong style={{ color: 'var(--accent-light)' }}>15</strong></span>
            <span style={{ color: 'var(--border)' }}>|</span>
            <span>🥈 2nd = <strong style={{ color: 'var(--accent-light)' }}>12</strong></span>
            <span style={{ color: 'var(--border)' }}>|</span>
            <span>✅ On-time = <strong style={{ color: 'var(--accent-light)' }}>10</strong></span>
            <span style={{ color: 'var(--border)' }}>|</span>
            <span>⏰ Late same day = <strong style={{ color: 'var(--orange)' }}>6</strong></span>
            <span style={{ color: 'var(--border)' }}>|</span>
            <span>📅 1 day late = <strong style={{ color: 'var(--orange)' }}>3</strong></span>
            <span style={{ color: 'var(--border)' }}>|</span>
            <span>📅 2+ days late = <strong style={{ color: 'var(--red)' }}>1</strong></span>
          </div>
          <div className="dashboard-grid">
            <div className="card">
              <TodayProblems onProblemComplete={refetchLeaderboard} groupId={groupId} />
            </div>
            <div>
              <div className="card">
                <Leaderboard
                  rankings={rankings}
                  loading={lbLoading}
                  error={lbError}
                  onRefresh={refetchLeaderboard}
                  groupId={groupId}
                />
              </div>
              <OverallStats groupStats={groupStats} />
            </div>
          </div>
        </div>
      )}

      {/* Students tab */}
      {tab === 'Students' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {rankings.length === 0 && !lbLoading && (
            <div className="empty-state"><p>No students in this group yet.</p></div>
          )}
          {rankings.map((entry) => (
            <Link
              key={entry.student._id}
              to={`/groups/${groupId}/students/${entry.student._id}`}
              style={{ textDecoration: 'none' }}
            >
              <div className="card" style={{ cursor: 'pointer' }}>
                <div className="flex items-center gap-4">
                  <div className="avatar avatar-lg" style={{ background: entry.student.avatarColor || '#6c63ff' }}>
                    {entry.student.initials}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="font-bold" style={{ color: 'var(--text-primary)', marginBottom: 2 }}>{entry.student.name}</div>
                    <div className="text-sm text-secondary">{entry.student.email}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.3rem' }}>{getRankEmoji(entry.rank)}</div>
                    <div style={{ fontWeight: 700, color: 'var(--accent-light)' }}>{entry.totalPoints} pts</div>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>›</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Members tab */}
      {tab === 'Members' && (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {members.map((member) => {
              const memberId = member._id?.toString();
              const memberIsCreator = memberId === creatorId;
              const isMe = memberId === currentStudent?._id?.toString();
              return (
                <div key={memberId} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="avatar" style={{ background: member.avatarColor || '#6c63ff' }}>
                    {member.initials || member.name?.[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="font-bold" style={{ color: 'var(--text-primary)' }}>
                      {member.name}{isMe ? ' (you)' : ''}
                    </div>
                    <div className="text-sm text-secondary">{member.email}</div>
                  </div>
                  {memberIsCreator && <span className="badge badge-purple">Creator</span>}
                  {/* Creator or admin can kick non-creator members */}
                  {isSignedIn && isCreator && !memberIsCreator && !isMe && (
                    <button
                      className="btn btn-outline btn-sm"
                      style={{ color: 'var(--red)', borderColor: 'var(--red)' }}
                      onClick={() => handleKick(memberId, member.name)}
                    >
                      Remove
                    </button>
                  )}
                  {/* Non-creator member can leave */}
                  {isSignedIn && isMe && !memberIsCreator && (
                    <button
                      className="btn btn-outline btn-sm"
                      style={{ color: 'var(--red)', borderColor: 'var(--red)' }}
                      onClick={handleLeave}
                    >
                      Leave
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Join code for creator */}
          {isCreator && group?.joinCode && (
            <div className="card" style={{ marginTop: 20, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Join Code:</span>
              <code style={{ background: 'var(--bg-input)', border: '1px solid var(--border-light)', borderRadius: 6, padding: '4px 12px', fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 700, letterSpacing: '0.14em', color: 'var(--accent-light)' }}>
                {group.joinCode}
              </code>
              <button className="btn btn-outline btn-sm" onClick={() => { navigator.clipboard.writeText(group.joinCode); addToast('Join code copied!', 'success'); }}>
                Copy
              </button>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Share this code to invite members</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GroupPage;
