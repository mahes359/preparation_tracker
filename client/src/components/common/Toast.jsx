// src/components/common/Toast.jsx

import { useApp } from '../../context/AppContext';

const ICONS = { success: '✓', error: '✕', info: 'ℹ' };
const COLORS = { success: 'var(--green)', error: 'var(--red)', info: 'var(--accent-light)' };

const Toast = () => {
  const { state, dispatch } = useApp();

  return (
    <div className="toast-container">
      {state.toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.type}`}>
          <span style={{ color: COLORS[toast.type], fontWeight: 700, fontSize: '1rem' }}>
            {ICONS[toast.type]}
          </span>
          <span style={{ flex: 1 }}>{toast.message}</span>
          <button
            onClick={() => dispatch({ type: 'REMOVE_TOAST', payload: toast.id })}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '1rem',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default Toast;
