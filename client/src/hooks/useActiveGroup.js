import { useApp } from '../context/AppContext';

const idStr = (v) => (v ? v.toString() : null);

export const useActiveGroup = () => {
  const { state } = useApp();

  const activeGroupId = state.activeGroupId;
  const isAdmin = state.currentStudent?.role === 'ADMIN';

  // Find active membership matching the selected group
  const activeMembership = state.memberships.find(
    (m) => m.status === 'ACTIVE' && idStr(m.groupId) === idStr(activeGroupId)
  );

  // For admins, hasActiveGroup is true if they have any active group OR if activeGroupId is set
  const hasActiveGroup = isAdmin
    ? (!!activeGroupId || state.memberships.some((m) => m.status === 'ACTIVE'))
    : !!activeMembership;

  return {
    activeGroupId,
    activeMembership,
    hasActiveGroup,
    isAdmin,
    allMemberships: state.memberships,
    allGroups: state.groups,
  };
};

export const usePendingRequests = () => {
  const { state } = useApp();
  const pending = state.memberships.filter((m) => m.status === 'PENDING');
  return {
    creationRequest: pending.find((m) => m.role === 'CREATOR'),
    joinRequests: pending.filter((m) => m.role === 'MEMBER'),
    hasPending: pending.length > 0,
  };
};

export default useActiveGroup;
