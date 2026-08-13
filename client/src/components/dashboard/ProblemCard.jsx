// src/components/dashboard/ProblemCard.jsx
// Smart problem card:
// - Highlights YOUR problem with a special border/glow
// - Only YOUR checkbox is interactive (others are display-only)
// - Shows "Your Problem" badge on your card

import { useState } from 'react';
import { useSignIn, useAuth } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import StatusChip from '../common/StatusChip';
import { getProblemStatus } from '../../utils/pointsHelpers';

const ProblemCard = ({ problem, onComplete, onDelete, isToday }) => {
  const [completing, setCompleting] = useState(false);
  const { state } = useApp();
  const { isSignedIn } = useAuth();

  const student = problem.studentId;
  const status = getProblemStatus(problem);
  const currentStudentId = state.currentStudent?._id?.toString();
  const problemStudentId = student?._id?.toString();
  const isMyProblem = isSignedIn && currentStudentId && currentStudentId === problemStudentId;

  const handleComplete = async () => {
    if (problem.isCompleted || completing) return;
    if (!isMyProblem) return; // guard — should not happen if UI is correct
    setCompleting(true);
    try {
      await onComplete(problem._id);
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div
      className={`problem-card ${status}`}
      style={
        isMyProblem
          ? {
              border: '1px solid rgba(124, 58, 237, 0.4)',
              background: 'rgba(124, 58, 237, 0.04)',
              boxShadow: '0 0 0 1px rgba(124, 58, 237, 0.15)',
            }
          : undefined
      }
    >
      {/* Avatar */}
      <div
        className="avatar"
        style={{ background: student?.avatarColor || '#6c63ff' }}
        title={student?.name}
      >
        {student?.initials || '?'}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="flex items-center gap-2 mb-3" style={{ flexWrap: 'wrap' }}>
          <span className="font-bold" style={{ fontSize: '0.95rem' }}>
            {student?.name || 'Unknown'}
          </span>

          {/* "You" badge */}
          {isMyProblem && (
            <span
              className="badge badge-purple"
              style={{ fontSize: '0.68rem', padding: '2px 7px' }}
            >
              You
            </span>
          )}

          <StatusChip problem={problem} />

          {problem.isCompleted && (
            <span
              className="badge badge-purple"
              style={{ marginLeft: 'auto' }}
              title={`${problem.pointsEarned} points earned`}
            >
              +{problem.pointsEarned} pts
            </span>
          )}
        </div>

        {/* Problem title + LeetCode link */}
        <div className="flex items-center gap-2">
          <a
            href={problem.leetcodeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2"
            style={{
              color: 'var(--text-primary)',
              fontWeight: 500,
              fontSize: '0.9rem',
              minWidth: 0,
            }}
          >
            <span className="truncate">{problem.title || 'LeetCode Problem'}</span>
            <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>↗</span>
          </a>
        </div>

        <div className="mt-2 text-xs text-muted truncate" style={{ maxWidth: '320px' }}>
          {problem.leetcodeUrl}
        </div>
      </div>

      {/* Checkbox / action area */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        {isToday && isMyProblem && !problem.isCompleted ? (
          /* Interactive checkbox — only for YOUR uncompleted problem today */
          <button
            className={`custom-checkbox ${completing ? 'loading' : ''}`}
            onClick={handleComplete}
            disabled={completing}
            title="Mark as completed"
            aria-label={`Mark ${problem.title} as completed`}
          >
            {completing && (
              <div className="spinner spinner-sm" style={{ width: 12, height: 12 }} />
            )}
          </button>
        ) : (
          /* Display-only checkbox for others */
          <div
            className={`custom-checkbox ${problem.isCompleted ? 'checked' : ''}`}
            title={
              !isSignedIn
                ? 'Sign in to complete problems'
                : !isMyProblem
                ? "You can only complete your own problems"
                : undefined
            }
            style={!isMyProblem && isToday && !problem.isCompleted ? { opacity: 0.35 } : undefined}
          >
            {problem.isCompleted && (
              <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                <path
                  d="M1 4L4 7L10 1"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        )}

        {/* Delete — only YOUR uncompleted problem */}
        {isToday && isMyProblem && !problem.isCompleted && onDelete && (
          <button
            className="btn btn-ghost"
            onClick={() => onDelete(problem._id)}
            title="Remove problem"
            style={{ padding: '2px 6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default ProblemCard;
