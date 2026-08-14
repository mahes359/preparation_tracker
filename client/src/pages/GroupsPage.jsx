import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { groupsApi } from '../services/api';
import Spinner from '../components/common/Spinner';

const GroupsPage = () => {
  const { state, addToast } = useApp();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requestName, setRequestName] = useState('');
  const [requestDescription, setRequestDescription] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const res = await groupsApi.getAll();
      setGroups(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleRequestGroup = async (event) => {
    event.preventDefault();
    if (!requestName.trim()) {
      addToast('Group name is required', 'error');
      return;
    }
    try {
      setSubmitting(true);
      await groupsApi.createRequest({ name: requestName, description: requestDescription });
      addToast('Group request submitted for review', 'success');
      setRequestName('');
      setRequestDescription('');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinGroup = async (event) => {
    event.preventDefault();
    if (!joinCode.trim()) {
      addToast('Join code is required', 'error');
      return;
    }
    try {
      setSubmitting(true);
      await groupsApi.join(joinCode);
      addToast('Join request sent to the group creator', 'success');
      setJoinCode('');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner text="Loading groups..." />;
  if (error) return <div className="empty-state"><p>{error}</p></div>;

  return (
    <div style={{ maxWidth: 980, margin: '0 auto' }}>
      <div className="card-header"><h1>Groups</h1></div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><span className="card-title">Request a new group</span></div>
        <form onSubmit={handleRequestGroup} style={{ display: 'grid', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Group Name</label>
            <input className="form-input" value={requestName} onChange={(e) => setRequestName(e.target.value)} placeholder="Interview Prep - Batch A" />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows="3" value={requestDescription} onChange={(e) => setRequestDescription(e.target.value)} placeholder="Describe the study cohort" />
          </div>
          <button className="btn btn-primary" disabled={submitting} type="submit">{submitting ? 'Submitting...' : 'Request Group'}</button>
        </form>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><span className="card-title">Join an approved group</span></div>
        <form onSubmit={handleJoinGroup} style={{ display: 'grid', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Join Code</label>
            <input className="form-input" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="ABC123" />
          </div>
          <button className="btn btn-outline" disabled={submitting} type="submit">{submitting ? 'Sending request...' : 'Request to Join'}</button>
        </form>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        {groups.length === 0 ? (
          <div className="empty-state"><p>No groups available.</p></div>
        ) : groups.map((group) => (
          <div key={group._id} className="card">
            <div className="flex justify-between" style={{ gap: 12, marginBottom: 12 }}>
              <div>
                <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{group.name}</div>
                <div className="text-sm text-secondary">Join code: {group.joinCode}</div>
              </div>
              <span className="badge badge-purple">{group.status}</span>
            </div>
            <p>{group.description || 'No description provided.'}</p>
            <div className="text-sm text-secondary">Created by: {group.createdBy?.name || 'Unknown'}</div>
            <div className="text-sm text-secondary">Members: {group.members?.length || 0}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GroupsPage;
