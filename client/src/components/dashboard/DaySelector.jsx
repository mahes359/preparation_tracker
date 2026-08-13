// src/components/dashboard/DaySelector.jsx
// Navigation control to browse through dates.

import { addDays, getDayLabel, isFuture } from '../../utils/dateHelpers';

const DaySelector = ({ selectedDate, onDateChange }) => {
  const prevDate = addDays(selectedDate, -1);
  const nextDate = addDays(selectedDate, 1);
  const isNextFuture = isFuture(nextDate);

  return (
    <div className="day-selector">
      <button
        className="day-btn"
        onClick={() => onDateChange(prevDate)}
        title="Previous day"
      >
        ‹
      </button>
      <span className="day-label">{getDayLabel(selectedDate)}</span>
      <button
        className="day-btn"
        onClick={() => onDateChange(nextDate)}
        disabled={isNextFuture}
        title={isNextFuture ? 'Cannot view future dates' : 'Next day'}
      >
        ›
      </button>
    </div>
  );
};

export default DaySelector;
