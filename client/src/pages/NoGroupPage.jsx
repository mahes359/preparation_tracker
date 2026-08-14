import { NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { usePendingRequests } from '../hooks/useActiveGroup';

const NoGroupPage = () => {
  const { state } = useApp();
  const { hasPending, creationRequest, joinRequests } = usePendingRequests();

  // If user is not signed in, show sign-in prompt on dashboard instead
  if (!state.currentStudent) {
    return null;
  }

  // If admin, don't show this page
  if (state.currentStudent?.role === 'ADMIN') {
    return null;
  }

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', textAlign: 'center' }}>
      <div className="card" style={{ padding: 40 }}>
        <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>📚</div>
        <h1 style={{ marginBottom: 8, color: 'var(--text-primary)' }}>Join or Create a Group</h1>
        <p style={{ marginBottom: 24, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          You haven't joined a group yet. Groups help organize study cohorts and track progress together.
        </p>

        {hasPending && (
          <div
            style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: 'var(--radius)',
              padding: 16,
              marginBottom: 24,
              textAlign: 'left',
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
              ⏳ Pending Requests
            </div>
            {creationRequest && (
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Your group request "{creationRequest.groupName || 'Unnamed'}" is awaiting admin approval.
              </div>
            )}
            {joinRequests.length > 0 && (
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                You have {joinRequests.length} join request{joinRequests.length > 1 ? 's' : ''} pending.
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'grid', gap: 12 }}>
          <NavLink to="/groups" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            Request New Group
          </NavLink>
          <NavLink to="/groups" className="btn btn-outline" style={{ textDecoration: 'none' }}>
            Join Existing Group
          </NavLink>
        </div>

        <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            <p style={{ marginBottom: 8 }}>
              <strong>New to this platform?</strong>
            </p>
            <p>
              1. Request a new group or join an existing one with a join code<br />
              2. Wait for approval from the group creator or admin<br />
              3. Once approved, you'll have full access to the dashboard
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoGroupPage;
