import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { groupsApi } from '../services/api';
import Spinner from '../components/common/Spinner';

const MyGroupsPage = () => {
  const navigate = useNavigate();
  const { state, addToast, fetchUserGroups } = useApp();
  const isAdmin = state.currentStudent?.role === 'ADMIN';

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [createData, setCreateData] = useState({ name: '', description: '' });
  const [joinCode, setJoinCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Redirect admin before rendering member UI
  if (isAdmin) return <Navigate to="/admin" replace />;

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!createData.name.trim()) { addToast('Group name is required', 'error'); return; }
    setSubmitting(true);
    try {
      await groupsApi.createRequest(createData);
      addToast('Group request submitted! Waiting for admin approval.', 'success');
      setCreateData({ name: '', description: '' });
      setShowCreateForm(false);
      await fetchUserGroups(null);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinGroup = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) { addToast('Join code is required', 'error'); return; }
    setSubmitting(true);
    try {
      await groupsApi.join(joinCode);
      addToast('Join request sent! Waiting for group creator approval.', 'success');
      setJoinCode('');
      setShowJoinForm(false);
      await fetchUserGroups(null);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!state.currentStudent && (state.loading.sync || state.loading.groups)) {
    return <Spinner text="Loading..." />;
  }

  if (!state.currentStudent) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 16px', textAlign: 'center', paddingTop: 60 }}>
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎯</div>
        <h2 style={{ marginBottom: 8 }}>Welcome to Prep Tracker</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Sign in to create or join a study group.</p>
      </div>
    );
  }

  const activeMembers = state.memberships.filter((m) => m.status === 'ACTIVE');
  const pendingRequests = state.memberships.filter((m) => m.status === 'PENDING');

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 16px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ marginBottom: 4 }}>My Groups</h1>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Click a group to open its dashboard</div>
      </div>

      {/* Create / Join */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 28 }}>
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '1.4rem', marginBottom: 10 }}>✏️</div>
            <h3 style={{ marginBottom: 6 }}>Create Group</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
              Start a new study group. Requires admin approval.
            </p>
            {!showCreateForm ? (
              <button className="btn btn-primary btn-sm" onClick={() => setShowCreateForm(true)}>Create Group</button>
            ) : (
              <form onSubmit={handleCreateGroup} style={{ display: 'grid', gap: 10 }}>
                <input className="form-input" placeholder="Group name" value={createData.name}
                  onChange={(e) => setCreateData({ ...createData, name: e.target.value })} disabled={submitting} />
                <textarea className="form-input" placeholder="Description (optional)" rows={2}
                  value={createData.description} onChange={(e) => setCreateData({ ...createData, description: e.target.value })} disabled={submitting} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>{submitting ? 'Sending...' : 'Request'}</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowCreateForm(false)}>Cancel</button>
                </div>
              </form>
            )}
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '1.4rem', marginBottom: 10 }}>🔗</div>
            <h3 style={{ marginBottom: 6 }}>Join Group</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
              Join with a code. Requires creator approval.
            </p>
            {!showJoinForm ? (
              <button className="btn btn-outline btn-sm" onClick={() => setShowJoinForm(true)}>Join Group</button>
            ) : (
              <form onSubmit={handleJoinGroup} style={{ display: 'grid', gap: 10 }}>
                <input className="form-input" placeholder="Enter join code" value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())} disabled={submitting} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button type="submit" className="btn btn-outline btn-sm" disabled={submitting}>{submitting ? 'Sending...' : 'Request'}</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowJoinForm(false)}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        </div>

      {/* Pending requests */}
      {pendingRequests.length > 0 && (
        <div className="card" style={{ marginBottom: 24, borderColor: 'rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.05)' }}>
          <div className="card-header"><span className="card-title">⏳ Pending Requests</span></div>
          <div style={{ display: 'grid', gap: 10 }}>
            {pendingRequests.map((req) => (
              <div key={req._id} style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid #3b82f6', background: 'rgba(59,130,246,0.05)' }}>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>{req.groupName || 'Unnamed Group'}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {req.role === 'CREATOR' ? 'Awaiting admin approval' : 'Awaiting creator approval'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active groups list */}
      {activeMembers.length > 0 && (
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 12 }}>
            Active Groups ({activeMembers.length})
          </div>
          <div style={{ display: 'grid', gap: 14 }}>
            {activeMembers.map((membership) => {
              const group = state.groups.find((g) => g._id === membership.groupId || g._id?.toString() === membership.groupId?.toString());
              return (
                <div
                  key={membership._id}
                  className="card"
                  style={{ padding: '20px', cursor: 'pointer' }}
                  onClick={() => navigate(`/groups/${membership.groupId}`)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                        {group?.name || 'Unknown Group'}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {group?.description || 'No description'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 6 }}>
                        {group?.members?.length || 0} members · Creator: {group?.createdBy?.name || '—'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                      <span className={`badge ${membership.role === 'CREATOR' ? 'badge-purple' : 'badge-green'}`}>
                        {membership.role}
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '1.3rem' }}>›</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeMembers.length === 0 && pendingRequests.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>📚</div>
          <h2 style={{ marginBottom: 8 }}>No Active Groups</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 380, margin: '0 auto' }}>
            Create a new group or join an existing one to get started.
          </p>
        </div>
      )}
    </div>
  );
};

export default MyGroupsPage;
