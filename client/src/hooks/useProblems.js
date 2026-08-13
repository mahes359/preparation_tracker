// src/hooks/useProblems.js
// Fetches and manages problems for a specific date.

import { useState, useEffect, useCallback } from 'react';
import { problemsApi } from '../services/api';
import { toApiDate } from '../utils/dateHelpers';

const useProblems = (date) => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const dateStr = toApiDate(date);

  const fetchProblems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await problemsApi.getByDate(dateStr);
      setProblems(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [dateStr]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  const completeProblem = useCallback(async (problemId) => {
    const res = await problemsApi.complete(problemId);
    setProblems((prev) =>
      prev.map((p) => (p._id === problemId ? res.data : p))
    );
    return res;
  }, []);

  const addProblem = useCallback(async (data) => {
    const res = await problemsApi.create(data);
    setProblems((prev) => [...prev, res.data]);
    return res;
  }, []);

  const removeProblem = useCallback(async (problemId) => {
    await problemsApi.delete(problemId);
    setProblems((prev) => prev.filter((p) => p._id !== problemId));
  }, []);

  return { problems, loading, error, refetch: fetchProblems, completeProblem, addProblem, removeProblem };
};

export default useProblems;
