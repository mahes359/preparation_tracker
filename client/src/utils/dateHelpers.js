// src/utils/dateHelpers.js

/**
 * Formats a Date to "YYYY-MM-DD" for API calls.
 */
export const toApiDate = (date) => {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

/**
 * Formats a date for display: "Aug 13, 2026"
 */
export const formatDisplayDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Formats a datetime for display: "11:45 PM"
 */
export const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Returns a human-friendly label for a date.
 */
export const getDayLabel = (dateStr) => {
  const today = toApiDate(new Date());
  const yesterday = toApiDate(new Date(Date.now() - 86400000));

  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  return formatDisplayDate(dateStr);
};

/**
 * Returns today as a YYYY-MM-DD string.
 */
export const getToday = () => toApiDate(new Date());

/**
 * Add N days to a date string and return new YYYY-MM-DD.
 */
export const addDays = (dateStr, days) => {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return toApiDate(d);
};

/**
 * Returns true if dateStr is in the future relative to today.
 */
export const isFuture = (dateStr) => dateStr > getToday();
