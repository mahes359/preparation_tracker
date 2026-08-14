// src/components/dashboard/AddProblemModal.jsx
// Smart modal:
// - Pre-selects the logged-in student automatically
// - If you're not logged in, shows a sign-in prompt
// - Blocks submitting a problem for someone else (you can only add your own)

import { useState } from 'react';
import { useAuth, SignInButton } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';

const AddProblemModal = ({ onClose, onAdd, selectedDate, groupId }) => {
  const { state } = useApp();
  const { isSignedIn } = useAuth();
  const { currentStudent } = state;

  const [form, setForm] = useState({
    studentId: currentStudent?._id || '',
    leetcodeUrl: '',
    groupId: groupId || '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.studentId) errs.studentId = 'Please select a student';
    if (!form.leetcodeUrl) {
      errs.leetcodeUrl = 'URL is required';
    } else if (!form.leetcodeUrl.includes('leetcode.com/problems/')) {
      errs.leetcodeUrl = 'Must be a valid LeetCode problem URL (e.g. https://leetcode.com/problems/two-sum/)';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);

    setSubmitting(true);
    try {
      await onAdd({ ...form, date: selectedDate });
      onClose();
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Not signed in — show a sign-in prompt instead of the form
  if (!isSignedIn) {
    return (
      <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔐</div>
          <h2 className="modal-title" style={{ marginBottom: 8 }}>Sign In Required</h2>
          <p className="text-sm text-secondary" style={{ marginBottom: 24 }}>
            You need to be signed in to add a problem. Your account will be automatically
            linked to your student record.
          </p>
          <SignInButton mode="modal">
            <button id="modal-sign-in-btn" className="btn btn-primary w-full">
              Sign In to Continue
            </button>
          </SignInButton>
          <button
            className="btn btn-ghost w-full"
            style={{ marginTop: 8 }}
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  const isMyStudentSelected = form.studentId === currentStudent?._id?.toString();

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-header">
          <h2 className="modal-title" id="modal-title">Add Today's Problem</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">×</button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Student selector */}
          <div className="form-group">
            <label className="form-label" htmlFor="student-select">Student</label>
            {currentStudent ? (
              // Logged-in user — lock to themselves with a nice display
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px',
                }}
              >
                <div
                  className="avatar avatar-sm"
                  style={{ background: currentStudent.avatarColor || '#6c63ff' }}
                >
                  {currentStudent.initials}
                </div>
                <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                  {currentStudent.name}
                </span>
                <span className="badge badge-purple" style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>
                  You
                </span>
              </div>
            ) : (
              <select
                id="student-select"
                className="form-select"
                value={form.studentId}
                onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))}
              >
                <option value="">Select a student...</option>
                {state.students.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            )}
            {errors.studentId && <p className="form-error">{errors.studentId}</p>}
          </div>

          {/* LeetCode URL */}
          <div className="form-group">
            <label className="form-label" htmlFor="url-input">LeetCode Problem URL</label>
            <input
              id="url-input"
              type="url"
              className="form-input"
              placeholder="https://leetcode.com/problems/two-sum/"
              value={form.leetcodeUrl}
              onChange={(e) => setForm((f) => ({ ...f, leetcodeUrl: e.target.value }))}
              autoFocus
            />
            {errors.leetcodeUrl && <p className="form-error">{errors.leetcodeUrl}</p>}
          </div>

          {errors.submit && (
            <div
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                marginBottom: '16px',
                color: 'var(--red)',
                fontSize: '0.85rem',
              }}
            >
              {errors.submit}
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <button
              type="button"
              className="btn btn-outline w-full"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              id="add-problem-submit"
              className="btn btn-primary w-full"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className="spinner spinner-sm" />
                  Adding...
                </>
              ) : (
                'Add Problem'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProblemModal;
