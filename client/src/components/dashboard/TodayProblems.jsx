// src/components/dashboard/TodayProblems.jsx
// Main problem list panel with day selector and add button.

import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import ProblemCard from './ProblemCard';
import AddProblemModal from './AddProblemModal';
import DaySelector from './DaySelector';
import Spinner from '../common/Spinner';
import useProblems from '../../hooks/useProblems';
import { getToday } from '../../utils/dateHelpers';

const TodayProblems = ({ onProblemComplete }) => {
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [showModal, setShowModal] = useState(false);
  const { addToast, state } = useApp();
  const { isSignedIn } = useAuth();
  const { currentStudent } = state;

  const { problems, loading, error, completeProblem, addProblem, removeProblem } =
    useProblems(selectedDate);

  const isToday = selectedDate === getToday();

  // Check if current user already posted a problem today
  const myProblemToday = isToday && currentStudent
    ? problems.find((p) => p.studentId?._id?.toString() === currentStudent._id?.toString())
    : null;

  const handleComplete = async (problemId) => {
    try {
      const res = await completeProblem(problemId);
      const pts = res.data.pointsEarned;
      const onTime = res.data.isOnTime;
      addToast(
        `✓ Marked complete! +${pts} pts${onTime ? ' (on time 🎉)' : ' (late)'}`,
        'success'
      );
      onProblemComplete?.();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleAdd = async (data) => {
    await addProblem(data);
    addToast('Problem added successfully!', 'success');
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

  const completedCount = problems.filter((p) => p.isCompleted).length;

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
                title={!isSignedIn ? 'Sign in to add a problem' : 'Add your daily problem'}
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
            <span>{completedCount} / {problems.length} completed</span>
            <span>{Math.round((completedCount / problems.length) * 100)}%</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(completedCount / problems.length) * 100}%` }}
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
        />
      )}
    </div>
  );
};

export default TodayProblems;
