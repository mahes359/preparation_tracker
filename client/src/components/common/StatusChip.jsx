// src/components/common/StatusChip.jsx

import { getProblemStatus, getStatusLabel, getStatusClass } from '../../utils/pointsHelpers';

const STATUS_ICONS = {
  ontime: '✓',
  late: '⏰',
  pending: '○',
  missed: '✗',
};

const StatusChip = ({ problem }) => {
  const status = getProblemStatus(problem);
  return (
    <span className={`status-chip ${getStatusClass(status)}`}>
      <span>{STATUS_ICONS[status]}</span>
      {getStatusLabel(status)}
    </span>
  );
};

export default StatusChip;
