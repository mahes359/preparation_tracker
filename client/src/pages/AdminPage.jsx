import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { adminApi, groupsApi } from '../services/api';
import Spinner from '../components/common/Spinner';

const AdminPage = () => {
  const { state, addToast } = useApp();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [dashboardRes, requestsRes] = await Promise.all([
        adminApi.getDashboard(),
        adminApi.getGroupRequests(),
      ]);
      setDashboard(dashboardRes.data || {});
      setRequests(requestsRes.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDecision = async (requestId, action) => {
    try {
      if (action === 'APPROVE') await adminApi.approveGroupRequest(requestId);
      else await adminApi.rejectGroupRequest(requestId);
      addToast(action === 'APPROVE' ? 'Group approved!' : 'Request rejected', action === 'APPROVE' ? 'success' : 'info');
      await loadData();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleKickMember = async (groupId, userId) => {
    try {
      await groupsApi.removeMember(groupId, userId);
      addToast('Member removed', 'success');
      await loadData();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  if (!state.currentStudent || state.currentStudent.role !== 'ADMIN') {
    return (
      <div className="empty-state">
        <div className="empty-icon">🔒</div>
        <p>Admin access required.</p>
      </div>
    );
  }

  if (loading) return <Spinner text="Loading admin dashboard..." />;
  if (error) return <div className="empty-state"><p>{error}</p></div>;

  const pendingRequests = requests.filter((r) => r.status === 'PENDING');
  const groups = dashboard?.groups || [];

  return (
    <div style={{ maxWidth: 980, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}><h1>Admin Dashboard</h1></div>

      {/* Real stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-item">
          <div className="stat-value">{dashboard?.totalStudents ?? '—'}</div>
          <div className="stat-label">Total Users</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{dashboard?.totalGroups ?? '—'}</div>
          <div className="stat-label">Active Groups</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{dashboard?.totalProblems ?? '—'}</div>
          <div className="stat-label">Problems Posted</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{dashboard?.totalCompletions ?? '—'}</div>
          <div className="stat-label">Completions</div>
        </div>
        <div className="stat-item">
          <div className="stat-value" style={{ color: pendingRequests.length > 0 ? 'var(--orange)' : undefined }}>
            {dashboard?.pendingGroupRequests ?? '—'}
          </div>
          <div className="stat-label">Pending Group Requests</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{dashboard?.pendingJoinRequests ?? '—'}</div>
          <div className="stat-label">Pending Join Requests</div>
        </div>
      </div>

      {/* Pending group creation requests */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <span className="card-title">Pending Group Requests</span>
          {pendingRequests.length > 0 && <span className="badge badge-orange">{pendingRequests.length}</span>}
        </div>
        {pendingRequests.length === 0 ? (
          <div className="empty-state" style={{ padding: 24 }}><p>No pending requests.</p></div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {pendingRequests.map((request) => (
              <div key={request._id} className="card" style={{ padding: 16 }}>
                <div className="flex justify-between" style={{ gap: 12, marginBottom: 8 }}>
                  <div>
                    <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{request.name}</div>
                    <div className="text-sm text-secondary">Requested by {request.userId?.name || 'Unknown'} · {request.userId?.email}</div>
                  </div>
                  <span className="badge badge-gray">{request.status}</span>
                </div>
                {request.description && <p className="text-sm text-secondary" style={{ marginBottom: 12 }}>{request.description}</p>}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button className="btn btn-outline btn-sm" onClick={() => handleDecision(request._id, 'REJECT')}>Reject</button>
                  <button className="btn btn-primary btn-sm" onClick={() => handleDecision(request._id, 'APPROVE')}>Approve</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All groups with member management */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">All Groups ({groups.length})</span>
        </div>
        {groups.length === 0 ? (
          <div className="empty-state" style={{ padding: 24 }}><p>No groups yet.</p></div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {groups.map((group) => (
              <div key={group._id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 16, cursor: 'pointer' }} onClick={() => navigate(`/groups/${group._id}`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div className="font-bold" style={{ color: 'var(--text-primary)', marginBottom: 2 }}>{group.name}</div>
                    <div className="text-sm text-secondary">Creator: {group.createdBy?.name || '—'}</div>
                    {group.description && <div className="text-sm text-secondary">{group.description}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                    <code style={{ background: 'var(--bg-input)', border: '1px solid var(--border-light)', borderRadius: 6, padding: '3px 8px', fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--accent-light)' }}>
                      {group.joinCode}
                    </code>
                    <span className="badge badge-green">{group.members?.length || 0} members</span>
                  </div>
                </div>
                {group.members?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {group.members.map((member) => {
                      const isCreator = group.createdBy?._id?.toString() === member._id?.toString();
                      return (
                        <div key={member._id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-input)', borderRadius: 20, padding: '4px 10px 4px 6px', border: '1px solid var(--border-light)' }}>
                          <div className="avatar" style={{ width: 22, height: 22, fontSize: '0.6rem', background: member.avatarColor || '#6c63ff' }}>{member.initials || member.name?.[0]}</div>
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>{member.name}</span>
                          {isCreator && <span className="badge badge-purple" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>Creator</span>}
                          {!isCreator && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleKickMember(group._id, member._id); }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.75rem', padding: '0 2px', lineHeight: 1 }}
                              title={`Remove ${member.name}`}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
