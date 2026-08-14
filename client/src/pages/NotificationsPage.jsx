import { useEffect, useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { groupsApi } from '../services/api';
import Spinner from '../components/common/Spinner';

const NotificationsPage = () => {
  const { state, addToast, fetchNotificationCount } = useApp();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const creatorGroups = state.groups.filter((g) => {
        const m = state.memberships.find(
          (m) => (m.groupId === g._id || m.groupId?.toString() === g._id?.toString()) && m.role === 'CREATOR' && m.status === 'ACTIVE'
        );
        return !!m;
      });

      if (creatorGroups.length === 0) { setPendingRequests([]); return; }

      const allRequests = [];
      await Promise.all(creatorGroups.map(async (group) => {
        try {
          const res = await groupsApi.getJoinRequests(group._id);
          const pending = (res.data || []).filter((r) => r.status === 'PENDING');
          allRequests.push(...pending.map((r) => ({ ...r, group })));
        } catch { /* silent */ }
      }));
      setPendingRequests(allRequests);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [state.groups, state.memberships]);

  useEffect(() => {
    loadRequests();
    const interval = setInterval(loadRequests, 30000);
    return () => clearInterval(interval);
  }, [loadRequests]);

  const handleDecision = async (groupId, requestId, action) => {
    try {
      await groupsApi.approveRequest(groupId, requestId, action);
      addToast(action === 'APPROVE' ? 'Request approved!' : 'Request rejected', action === 'APPROVE' ? 'success' : 'info');
      await loadRequests();
      await fetchNotificationCount();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  if (!state.currentStudent) return null;

  const isCreator = state.memberships.some((m) => m.role === 'CREATOR' && m.status === 'ACTIVE');
  const isAdmin = state.currentStudent?.role === 'ADMIN';

  if (!isCreator && !isAdmin) {
    return (
      <div style={{ maxWidth: 600, margin: '40px auto', textAlign: 'center' }}>
        <div className="card" style={{ padding: 40 }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>🔕</div>
          <h2 style={{ marginBottom: 8 }}>No Notifications</h2>
          <p style={{ color: 'var(--text-secondary)' }}>You don't manage any groups yet.</p>
        </div>
      </div>
    );
  }

  if (loading) return <Spinner text="Loading notifications..." />;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 16px' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1>Notifications</h1>
        {pendingRequests.length > 0 && (
          <span className="badge badge-red">{pendingRequests.length}</span>
        )}
      </div>

      {error && (
        <div className="card" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', marginBottom: 16 }}>
          <div style={{ color: '#ef4444' }}>⚠️ {error}</div>
        </div>
      )}

      {pendingRequests.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>✨</div>
          <p style={{ color: 'var(--text-secondary)' }}>No pending join requests</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {pendingRequests.map((request) => (
            <div key={request._id} className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {request.userId?.name || 'Unknown Student'} wants to join
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Group: <strong>{request.group?.name || 'Unknown'}</strong>
                  </div>
                  {request.message && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 6, fontStyle: 'italic' }}>
                      "{request.message}"
                    </div>
                  )}
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
                    {new Date(request.createdAt).toLocaleString()}
                  </div>
                </div>
                <span className="badge badge-orange">PENDING</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleDecision(request.groupId, request._id, 'APPROVE')}
                >
                  Approve
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => handleDecision(request.groupId, request._id, 'REJECT')}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
