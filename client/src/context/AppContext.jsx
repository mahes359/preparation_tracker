// src/context/AppContext.jsx
// Global state: students list, scoring config, current student (me), toast notifications.

import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { studentsApi, configApi, authApi, setTokenGetter } from '../services/api';

const AppContext = createContext(null);

const initialState = {
  students: [],
  scoringConfig: null,
  currentStudent: null,  // the logged-in user's Student record
  toasts: [],
  loading: { students: false, config: false, sync: false },
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_STUDENTS':
      return { ...state, students: action.payload };
    case 'SET_CONFIG':
      return { ...state, scoringConfig: action.payload };
    case 'SET_CURRENT_STUDENT':
      return { ...state, currentStudent: action.payload };
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

  // Register token getter so Axios interceptor can attach Clerk JWT
  useEffect(() => {
    setTokenGetter(() => getToken());
  }, [getToken]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    dispatch({ type: 'ADD_TOAST', payload: { id, message, type } });
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: id }), 3500);
  }, []);

  const fetchStudents = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: { students: true } });
    try {
      const res = await studentsApi.getAll();
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
      // silent — use defaults
    }
  }, []);

  // When Clerk reports signed-in, sync user to get/create Student record
  const syncCurrentUser = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: { sync: true } });
    try {
      const res = await authApi.sync();
      dispatch({ type: 'SET_CURRENT_STUDENT', payload: res.data.student });
      if (res.data.isNew) {
        addToast(`Welcome to Prep Tracker, ${res.data.student.name}! 🎉`, 'success');
      }
      // Refresh student list to include the new student
      await fetchStudents();
    } catch (err) {
      addToast('Failed to sync your profile', 'error');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { sync: false } });
    }
  }, [addToast, fetchStudents]);

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn) {
      syncCurrentUser();
      fetchConfig();
    } else {
      // Not signed in — still fetch students for read-only view
      fetchStudents();
      fetchConfig();
      dispatch({ type: 'SET_CURRENT_STUDENT', payload: null });
    }
  }, [isLoaded, isSignedIn, syncCurrentUser, fetchStudents, fetchConfig]);

  return (
    <AppContext.Provider value={{ state, dispatch, addToast, fetchStudents }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
