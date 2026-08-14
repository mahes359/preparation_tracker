import { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { studentsApi, configApi, authApi, groupsApi, setTokenGetter } from '../services/api';

const AppContext = createContext(null);

const initialState = {
  students: [],
  scoringConfig: null,
  currentStudent: null,
  activeGroupId: null,
  groups: [],
  memberships: [],
  notificationCount: 0,
  toasts: [],
  loading: { students: false, config: false, sync: false, groups: false },
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_STUDENTS':
      return { ...state, students: action.payload };
    case 'SET_CONFIG':
      return { ...state, scoringConfig: action.payload };
    case 'SET_CURRENT_STUDENT':
      return { ...state, currentStudent: action.payload };
    case 'SET_GROUPS':
      return { ...state, groups: action.payload };
    case 'SET_MEMBERSHIPS':
      return { ...state, memberships: action.payload };
    case 'SET_ACTIVE_GROUP':
      return { ...state, activeGroupId: action.payload };
    case 'SET_NOTIFICATION_COUNT':
      return { ...state, notificationCount: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: { ...state.loading, ...action.payload } };
    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, { id: Date.now(), ...action.payload }] };
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.payload) };
    default:
      return state;
  }
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const notifIntervalRef = useRef(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    setTokenGetter(() => getToken());
  }, [getToken]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    dispatch({ type: 'ADD_TOAST', payload: { id, message, type } });
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: id }), 3500);
  }, []);

  const fetchStudents = useCallback(async (groupId = null) => {
    dispatch({ type: 'SET_LOADING', payload: { students: true } });
    try {
      const res = await studentsApi.getAll(groupId);
      dispatch({ type: 'SET_STUDENTS', payload: res.data });
    } catch {
      addToast('Failed to load students', 'error');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { students: false } });
    }
  }, [addToast]);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await configApi.getScoringConfig();
      dispatch({ type: 'SET_CONFIG', payload: res.data });
    } catch {
      // silent
    }
  }, []);

  const fetchUserGroups = useCallback(async (currentActiveGroupId = null) => {
    dispatch({ type: 'SET_LOADING', payload: { groups: true } });
    try {
      const res = await groupsApi.getUserMemberships();
      const memberships = res.data?.memberships || [];
      const groups = res.data?.groups || [];
      dispatch({ type: 'SET_MEMBERSHIPS', payload: memberships });
      dispatch({ type: 'SET_GROUPS', payload: groups });
      // Clear activeGroupId if it no longer matches any active membership
      const activeIds = memberships.filter((m) => m.status === 'ACTIVE').map((m) => m.groupId?.toString());
      if (currentActiveGroupId && !activeIds.includes(currentActiveGroupId.toString())) {
        dispatch({ type: 'SET_ACTIVE_GROUP', payload: null });
      }
    } catch {
      // silent
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { groups: false } });
    }
  }, []);

  const fetchNotificationCount = useCallback(async () => {
    try {
      const res = await groupsApi.getNotificationCount();
      dispatch({ type: 'SET_NOTIFICATION_COUNT', payload: res.data?.count || 0 });
    } catch {
      // silent
    }
  }, []);

  const syncCurrentUser = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: { sync: true } });
    try {
      const res = await authApi.sync();
      dispatch({ type: 'SET_CURRENT_STUDENT', payload: res.data.student });
      if (res.data.isNew) {
        addToast(`Welcome to Prep Tracker, ${res.data.student.name}! 🎉`, 'success');
      }
      await fetchStudents(); // initial load without group scope; StudentsPage re-fetches with scope
      await fetchUserGroups(stateRef.current.activeGroupId);
      await fetchNotificationCount();
    } catch {
      addToast('Failed to sync your profile', 'error');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { sync: false } });
    }
  }, [addToast, fetchStudents, fetchUserGroups, fetchNotificationCount]);

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      syncCurrentUser();
      fetchConfig();
    } else {
      fetchConfig();
      dispatch({ type: 'SET_STUDENTS', payload: [] });
      dispatch({ type: 'SET_CURRENT_STUDENT', payload: null });
      dispatch({ type: 'SET_MEMBERSHIPS', payload: [] });
      dispatch({ type: 'SET_GROUPS', payload: [] });
      dispatch({ type: 'SET_ACTIVE_GROUP', payload: null });
      dispatch({ type: 'SET_NOTIFICATION_COUNT', payload: 0 });
    }
  }, [isLoaded, isSignedIn, syncCurrentUser, fetchConfig]);

  // Poll notification count every 30s when signed in
  useEffect(() => {
    if (isSignedIn) {
      if (notifIntervalRef.current) clearInterval(notifIntervalRef.current);
      notifIntervalRef.current = setInterval(fetchNotificationCount, 30000);
    } else {
      if (notifIntervalRef.current) clearInterval(notifIntervalRef.current);
    }
    return () => {
      if (notifIntervalRef.current) clearInterval(notifIntervalRef.current);
    };
  }, [isSignedIn, fetchNotificationCount]);

  const setActiveGroup = useCallback((groupId) => {
    dispatch({ type: 'SET_ACTIVE_GROUP', payload: groupId });
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch, addToast, fetchStudents, fetchUserGroups, fetchNotificationCount, setActiveGroup }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
