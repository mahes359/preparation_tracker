// src/components/dashboard/TodayProblems.jsx
// Main problem list panel with day selector and add button.

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import ProblemCard from './ProblemCard';
import AddProblemModal from './AddProblemModal';
import DaySelector from './DaySelector';
import Spinner from '../common/Spinner';
import useProblems from '../../hooks/useProblems';
import { getToday } from '../../utils/dateHelpers';

const TodayProblems = ({ onProblemComplete, groupId = null }) => {
  const [selectedDate, setSelectedDate] = useState(getToday());
  const lastTodayRef = useRef(getToday());
  const [showModal, setShowModal] = useState(false);
  const { addToast, state } = useApp();
  const { isSignedIn } = useAuth();
  const { currentStudent } = state;

  // A user can interact if they are signed in and have a groupId context
  const canInteract = isSignedIn && !!groupId;

  const { problems, loading, error, completeProblem, saveProgress, addProblem, removeProblem } =
    useProblems(selectedDate, currentStudent?._id, groupId);

  const isToday = selectedDate === getToday();

  // Keep the default view on the actual calendar day when midnight passes.
  useEffect(() => {
    const timer = setInterval(() => {
      const actualToday = getToday();
      setSelectedDate((current) => (current === lastTodayRef.current ? actualToday : current));
      lastTodayRef.current = actualToday;
    }, 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  // Check if current user already posted a problem today
  const myProblemToday = isToday && currentStudent
    ? problems.find((p) => p.studentId?._id?.toString() === currentStudent._id?.toString())
    : null;

  const handleComplete = async (problemId) => {
    try {
      if (!currentStudent) throw new Error('Sign in to complete problems');
      if (!canInteract) throw new Error('You must belong to an active group to mark problems complete');
      const res = await completeProblem(problemId, currentStudent._id);
      const pts = res.data.pointsEarned;
      const onTime = res.data.isOnTime;
      if (!res.data.completedAt) {
        addToast('Marked pending. Completion points removed.', 'success');
        onProblemComplete?.();
        return;
      }
      addToast(`✓ Marked complete! +${pts} pts${onTime ? ' (on time 🎉)' : ' (late)'}`, 'success');
      onProblemComplete?.();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleAdd = async (data) => {
    if (!canInteract) {
      addToast('You must belong to an active group to add problems', 'error');
      return;
    }
    await addProblem(data);
    addToast('Problem added successfully!', 'success');
    onProblemComplete?.();
  };

  const handleSaveNote = async (problemId, note) => {
    if (!currentStudent) throw new Error('Sign in to save notes');
    await saveProgress(problemId, currentStudent._id, note);
    addToast('Note saved', 'success');
    onProblemComplete?.();
  };

  const handleDelete = async (problemId) => {
    try {
      await removeProblem(problemId);
      addToast('Problem removed', 'info');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const totalQuestions = problems.length;
  const completedCount = currentStudent
    ? problems.filter((problem) => problem.completions?.some((progress) =>
      progress.studentId?._id?.toString() === currentStudent._id?.toString() && progress.completedAt
    )).length
    : 0;

  return (
    <div>
      <div className="card-header">
        <div>
          <h2 className="card-title">Problems</h2>
          <div className="mt-1">
            <DaySelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
          </div>
        </div>

        {isToday && (
          <div>
            {myProblemToday ? (
              // Already submitted — show status
              <span
                className="badge badge-green"
                title="You already posted today's problem"
              >
                ✓ Submitted
              </span>
            ) : (
              <button
                id="add-problem-btn"
                className="btn btn-primary btn-sm"
                onClick={() => setShowModal(true)}
                disabled={!canInteract}
                title={
                  !isSignedIn
                    ? 'Sign in to add a problem'
                    : !groupId
                    ? 'Open a group to add problems'
                    : 'Add your daily problem'
                }
              >
                + Add Problem
              </button>
            )}
          </div>
        )}
      </div>

      {/* Progress summary */}
      {problems.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div className="flex justify-between text-xs text-muted mb-3" style={{ marginBottom: 6 }}>
            <span>{completedCount} / {totalQuestions} completions</span>
            <span>{totalQuestions ? Math.round((completedCount / totalQuestions) * 100) : 0}%</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${totalQuestions ? (completedCount / totalQuestions) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {loading && <Spinner text="Loading problems..." />}
      {error && (
        <div className="empty-state">
          <div className="empty-icon">⚠️</div>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && problems.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>
            No problems for this day
          </p>
          {isToday && (
            <p className="text-sm" style={{ marginTop: 8 }}>
              Click "Add Problem" to post today's LeetCode problem.
            </p>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {problems.map((problem) => (
          <ProblemCard
            key={problem._id}
            problem={problem}
            onComplete={handleComplete}
            onSaveNote={handleSaveNote}
            onDelete={handleDelete}
            isToday={isToday}
          />
        ))}
      </div>

      {showModal && (
        <AddProblemModal
          onClose={() => setShowModal(false)}
          onAdd={handleAdd}
          selectedDate={selectedDate}
          groupId={groupId}
        />
      )}
    </div>
  );
};

export default TodayProblems;
