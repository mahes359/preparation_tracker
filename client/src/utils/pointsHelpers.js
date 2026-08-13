// src/utils/pointsHelpers.js

/**
 * Returns the display status of a problem.
 */
export const getProblemStatus = (problem) => {
  if (!problem.isCompleted) {
    const now = new Date();
    const deadline = new Date(problem.deadline);
    if (now > deadline) return 'missed';
    return 'pending';
  }
  return problem.isOnTime ? 'ontime' : 'late';
};

/**
 * Returns the label text for a status.
 */
export const getStatusLabel = (status) => {
  const labels = {
    ontime: 'On Time',
    late: 'Late',
    pending: 'Pending',
    missed: 'Missed',
  };
  return labels[status] || status;
};

/**
 * Returns the CSS class for a status chip.
 */
export const getStatusClass = (status) => {
  const classes = {
    ontime: 'status-ontime',
    late: 'status-late',
    pending: 'status-pending',
    missed: 'status-missed',
  };
  return classes[status] || '';
};

/**
 * Returns the emoji for a rank position.
 */
export const getRankEmoji = (rank) => {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
};

/**
 * Returns the CSS class for a rank badge.
 */
export const getRankClass = (rank) => {
  if (rank === 1) return 'rank-1';
  if (rank === 2) return 'rank-2';
  if (rank === 3) return 'rank-3';
  return 'rank-other';
};

/**
 * Calculates completion percentage (0-100).
 */
export const completionPercent = (completed, total) => {
  if (!total) return 0;
  return Math.round((completed / total) * 100);
};
