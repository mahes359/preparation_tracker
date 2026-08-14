import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SignedOut, SignInButton } from '@clerk/clerk-react';
import { useApp } from '../context/AppContext';
import { useActiveGroup } from '../hooks/useActiveGroup';
import TodayProblems from '../components/dashboard/TodayProblems';
import Leaderboard from '../components/leaderboard/Leaderboard';
import OverallStats from '../components/dashboard/OverallStats';
import useLeaderboard from '../hooks/useLeaderboard';
import Spinner from '../components/common/Spinner';

const GroupSelector = ({ groups, memberships, activeGroupId, onSelect }) => {
  const activeMembers = memberships.filter((m) => m.status === 'ACTIVE');
  if (activeMembers.length <= 1) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Group:
      </span>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {activeMembers.map((m) => {
          const group = groups.find((g) => g._id === m.groupId || g._id?.toString() === m.groupId?.toString());
          const isActive = activeGroupId === m.groupId || activeGroupId?.toString() === m.groupId?.toString();
          return (
            <button
              key={m._id}
              onClick={() => onSelect(m.groupId)}
              className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-outline'}`}
            >
              {group?.name || 'Group'}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { state, setActiveGroup } = useApp();
  const { hasActiveGroup, isAdmin, activeGroupId } = useActiveGroup();
  const { rankings, groupStats, loading: leaderboardLoading, error: leaderboardError, refetch: refetchLeaderboard } = useLeaderboard(activeGroupId);

  // Signed-in user with no active group → redirect to /my-groups
  useEffect(() => {
    if (state.currentStudent && !hasActiveGroup && !isAdmin && !state.loading.sync) {
      navigate('/my-groups', { replace: true });
    }
  }, [state.currentStudent, hasActiveGroup, isAdmin, state.loading.sync, navigate]);

  if (state.loading.sync) return <Spinner text="Loading..." />;

  const activeGroup = state.groups.find(
    (g) => g._id === activeGroupId || g._id?.toString() === activeGroupId?.toString()
  );

  return (
    <div>
      <SignedOut>
        <div style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(14,165,233,0.08))',
          border: '1px solid rgba(124,58,237,0.25)',
          borderRadius: 'var(--radius)',
          padding: '14px 20px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '1.2rem' }}>🎯</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>Track your own progress</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Sign in to add your daily problem, mark it complete, and earn points.
            </div>
          </div>
          <SignInButton mode="modal">
            <button className="btn btn-primary btn-sm">Sign In Free</button>
          </SignInButton>
        </div>
      </SignedOut>

      {/* Group selector for multi-group users */}
      <GroupSelector
        groups={state.groups}
        memberships={state.memberships}
        activeGroupId={activeGroupId}
        onSelect={setActiveGroup}
      />

      {/* Active group name */}
      {activeGroup && (
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2 style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{activeGroup.name}</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>— {activeGroup.members?.length || 0} members</span>
        </div>
      )}

      <div className="dashboard-grid">
        <div className="card">
          <TodayProblems onProblemComplete={refetchLeaderboard} groupId={activeGroupId} />
        </div>
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
