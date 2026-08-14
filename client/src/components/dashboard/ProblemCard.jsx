import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import StatusChip from '../common/StatusChip';
import { getProblemStatus } from '../../utils/pointsHelpers';

const ProblemCard = ({ problem, onComplete, onSaveNote, onDelete, isToday }) => {
  const [completing, setCompleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const { state } = useApp();
  const { isSignedIn } = useAuth();
  const currentStudentId = state.currentStudent?._id?.toString();
  const poster = problem.studentId;
  const myProgress = problem.completions?.find((progress) => progress.studentId?._id?.toString() === currentStudentId);
  const [note, setNote] = useState(myProgress?.note || '');
  useEffect(() => setNote(myProgress?.note || ''), [myProgress?.note]);

  const isCompleted = Boolean(myProgress?.completedAt);
  const statusProblem = { ...problem, isCompleted, isOnTime: myProgress?.isOnTime };
  const isMyPost = currentStudentId && poster?._id?.toString() === currentStudentId;

  const complete = async () => {
    if (completing) return;
    setCompleting(true);
    try { await onComplete(problem._id); } finally { setCompleting(false); }
  };

  const saveNote = async () => {
    if (saving) return;
    setSaving(true);
    try { await onSaveNote(problem._id, note); } finally { setSaving(false); }
  };

  return (
    <div className={`problem-card ${getProblemStatus(statusProblem)}`}>
      <div className="avatar" style={{ background: poster?.avatarColor || '#6c63ff' }}>{poster?.initials || '?'}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="flex items-center gap-2 mb-3" style={{ flexWrap: 'wrap' }}>
          <a href={problem.leetcodeUrl} target="_blank" rel="noopener noreferrer" className="font-bold truncate" style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{problem.title || 'LeetCode Problem'}</a>
          <StatusChip problem={statusProblem} />
          {isCompleted && <span className="badge badge-purple">+{myProgress.pointsEarned} pts</span>}
        </div>
        <div className="text-xs text-muted">Posted by {poster?.name || 'Unknown'}</div>
        <div className="text-xs text-muted mt-2">My Progress: {isCompleted ? 'Completed' : 'Pending'}</div>
        <div className="mt-2 text-xs text-muted truncate" style={{ maxWidth: '320px' }}>{problem.leetcodeUrl}</div>
        {isSignedIn && currentStudentId && (
          <div className="mt-2" style={{ display: 'flex', gap: 8 }}>
            <input className="form-input" value={note} onChange={(event) => setNote(event.target.value)} placeholder="My note" maxLength={2000} aria-label={`Personal note for ${problem.title}`} />
            <button className="btn btn-outline btn-sm" onClick={saveNote} disabled={saving}>{saving ? 'Saving...' : 'Save Note'}</button>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        {isSignedIn && currentStudentId ? (
          <button className={`custom-checkbox ${isCompleted ? 'checked' : ''} ${completing ? 'loading' : ''}`} onClick={complete} disabled={completing} title={isCompleted ? 'Mark as pending' : 'Mark as completed'} aria-label={`Mark ${problem.title} as ${isCompleted ? 'pending' : 'completed'}`}>{completing ? <div className="spinner spinner-sm" style={{ width: 12, height: 12 }} /> : isCompleted && <span style={{ color: 'white' }}>✓</span>}</button>
        ) : (
          <div className={`custom-checkbox ${isCompleted ? 'checked' : ''}`} title={!isSignedIn ? 'Sign in to complete problems' : undefined}>{isCompleted && <span style={{ color: 'white' }}>✓</span>}</div>
        )}
        {isToday && isMyPost && !problem.completions?.length && onDelete && <button className="btn btn-ghost" onClick={() => onDelete(problem._id)} title="Remove problem" style={{ padding: '2px 6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>x</button>}
      </div>
    </div>
  );
};

export default ProblemCard;
