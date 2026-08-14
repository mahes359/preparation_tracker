// src/utils/dateHelpers.js

/**
 * Formats a Date to "YYYY-MM-DD" for API calls.
 */
const TIME_ZONE = import.meta.env.VITE_APP_TIMEZONE || 'Asia/Kolkata';

const dateParts = (date) => Object.fromEntries(
  new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date(date)).filter(({ type }) => type !== 'literal')
    .map(({ type, value }) => [type, value])
);

export const toApiDate = (date) => {
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const { year, month, day } = dateParts(date);
  return `${year}-${month}-${day}`;
};

/**
 * Formats a date for display: "Aug 13, 2026"
 */
export const formatDisplayDate = (date) => {
  const value = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? new Date(`${date}T12:00:00Z`)
    : new Date(date);
  return value.toLocaleDateString('en-US', {
    timeZone: TIME_ZONE,
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
    timeZone: TIME_ZONE,
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
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/**
 * Returns true if dateStr is in the future relative to today.
 */
export const isFuture = (dateStr) => dateStr > getToday();
