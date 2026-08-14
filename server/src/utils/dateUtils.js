const { APP_TIMEZONE } = require('../config/env');

const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TIMEZONE,
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
});

const zonedParts = (date) => Object.fromEntries(
  formatter.formatToParts(new Date(date))
    .filter(({ type }) => type !== 'literal')
    .map(({ type, value }) => [type, type === 'hour' && value === '24' ? 0 : Number(value)])
);

const dayKeyFor = (date = new Date()) => {
  const { year, month, day } = zonedParts(date);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const parseDayKey = (value) => {
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) throw new Error('Date must be in YYYY-MM-DD format');
  const [, year, month, day] = match.map(Number);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
    throw new Error('Date must be a valid calendar day');
  }
  return { year, month, day };
};

const zonedDateTime = (dayKey, hour = 0, minute = 0, second = 0, ms = 0) => {
  const { year, month, day } = parseDayKey(dayKey);
  const wallClock = Date.UTC(year, month - 1, day, hour, minute, second, ms);
  let instant = wallClock;
  for (let i = 0; i < 2; i += 1) {
    const roundedInstant = Math.floor(instant / 1000) * 1000;
    const parts = zonedParts(roundedInstant);
    const offset = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) - roundedInstant;
    instant = wallClock - offset;
  }
  return new Date(instant);
};

const toDateString = (date) => {
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  return dayKeyFor(date);
};

const startOfDayUTC = (date) => zonedDateTime(toDateString(date || new Date()));
const todayKey = () => dayKeyFor(new Date());
const todayUTC = () => startOfDayUTC(todayKey());

const endOfDayUTC = (date) => {
  const { year, month, day } = parseDayKey(toDateString(date));
  const nextKey = new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
  return new Date(zonedDateTime(nextKey).getTime() - 1);
};

const buildDeadline = (date, deadlineHour, deadlineMinute = 59) =>
  zonedDateTime(toDateString(date), deadlineHour, deadlineMinute, 59, 999);

const titleFromUrl = (url) => {
  try {
    const match = url.match(/\/problems\/([^/]+)/);
    if (!match) return '';
    return match[1].split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  } catch {
    return '';
  }
};

module.exports = {
  APP_TIMEZONE, startOfDayUTC, todayUTC, todayKey, endOfDayUTC,
  buildDeadline, toDateString, titleFromUrl,
};
