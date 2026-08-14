import { useNavigate } from 'react-router-dom';
import { useActiveGroup } from '../hooks/useActiveGroup';
import { useApp } from '../context/AppContext';

// Wrapper component to protect group-scoped pages (Dashboard, Questions, etc.)
export const GateGroupAccess = ({ children }) => {
  const navigate = useNavigate();
  const { state } = useApp();
  const { hasActiveGroup, isAdmin } = useActiveGroup();

  // Admin users can bypass group requirement
  if (isAdmin) {
    return children;
  }

  // User is signed in but not admin
  if (state.currentStudent && !hasActiveGroup) {
    // Redirect to group selection page
    navigate('/groups', { replace: true });
    return null;
  }

  // User not signed in — show sign-in prompt (handled by parent Dashboard)
  if (!state.currentStudent) {
    return children;
  }

  return children;
};

export default GateGroupAccess;
