// src/utils/dateUtils.js
// All date arithmetic lives here — one place to fix timezone issues.

/**
 * Returns the UTC start-of-day (midnight) Date for a given date string or Date.
 * e.g. "2026-08-13" → 2026-08-13T00:00:00.000Z
 */
const startOfDayUTC = (date) => {
  const d = date ? new Date(date) : new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

/**
 * Returns the UTC start-of-day for TODAY.
 */
const todayUTC = () => startOfDayUTC(new Date());

/**
 * Returns the UTC end-of-day (just before midnight) for a given date.
 */
const endOfDayUTC = (date) => {
  const d = startOfDayUTC(date);
  d.setUTCHours(23, 59, 59, 999);
  return d;
};

/**
 * Builds the deadline Date for a problem posted on a given calendar date.
 * The deadline is {date} at {deadlineHourUTC}:59:59 UTC.
 * @param {Date|string} date - the calendar date of the problem
 * @param {number} deadlineHourUTC - hour in UTC (0-23)
 */
const buildDeadline = (date, deadlineHourUTC) => {
  const d = startOfDayUTC(date);
  d.setUTCHours(deadlineHourUTC, 59, 59, 999);
  return d;
};

/**
 * Returns a YYYY-MM-DD string for a Date (UTC).
 */
const toDateString = (date) => {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

/**
 * Extracts problem title from a LeetCode URL slug.
 * e.g. "https://leetcode.com/problems/two-sum/" → "Two Sum"
 */
const titleFromUrl = (url) => {
  try {
    const match = url.match(/\/problems\/([^/]+)/);
    if (!match) return '';
    return match[1]
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  } catch {
    return '';
  }
};

module.exports = { startOfDayUTC, todayUTC, endOfDayUTC, buildDeadline, toDateString, titleFromUrl };
