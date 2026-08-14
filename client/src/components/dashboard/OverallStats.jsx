const OverallStats = ({ groupStats }) => {
  if (!groupStats) return null;
  const {
    questionsPosted, totalCompletions, totalRequiredCompletions,
    completionRate, onTimeCompletions, lateCompletions,
  } = groupStats;
  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div className="card-header"><span className="card-title">Group Stats</span></div>
      <div className="stats-grid">
        <div className="stat-item"><div className="stat-value">{questionsPosted}</div><div className="stat-label">Questions Posted</div></div>
        <div className="stat-item"><div className="stat-value">{totalCompletions}</div><div className="stat-label">Total Completions</div></div>
        <div className="stat-item"><div className="stat-value">{completionRate}%</div><div className="stat-label">Completion Rate</div></div>
        <div className="stat-item"><div className="stat-value" style={{ color: 'var(--green)', WebkitTextFillColor: 'var(--green)' }}>{onTimeCompletions}</div><div className="stat-label">On Time</div></div>
        <div className="stat-item"><div className="stat-value" style={{ color: 'var(--orange)', WebkitTextFillColor: 'var(--orange)' }}>{lateCompletions}</div><div className="stat-label">Late</div></div>
      </div>
      {totalRequiredCompletions > 0 && <div style={{ marginTop: 16 }}><div className="flex justify-between text-xs text-muted" style={{ marginBottom: 6 }}><span>{totalCompletions} / {totalRequiredCompletions} required completions</span><span>{completionRate}%</span></div><div className="progress-bar"><div className="progress-fill" style={{ width: `${completionRate}%` }} /></div></div>}
    </div>
  );
};

export default OverallStats;
