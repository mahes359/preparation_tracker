import { useState, useEffect, useCallback } from 'react';
import { problemsApi } from '../services/api';
import { toApiDate } from '../utils/dateHelpers';

const useProblems = (date, studentId, groupId = null) => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const dateStr = toApiDate(date);

  const fetchProblems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await problemsApi.getByDate(dateStr, studentId, groupId);
      setProblems(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [dateStr, studentId, groupId]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  // Poll every 45s for other users' changes
  useEffect(() => {
    const interval = setInterval(fetchProblems, 45000);
    return () => clearInterval(interval);
  }, [fetchProblems]);

  const completeProblem = useCallback(async (problemId, studentId) => {
    const res = await problemsApi.complete(problemId, studentId);
    setProblems((prev) => prev.map((problem) => {
      if (problem._id !== problemId) return problem;
      const records = [...(problem.completions || [])];
      const index = records.findIndex((c) => c.studentId?._id?.toString() === studentId.toString());
      if (index >= 0) records[index] = res.data;
      else records.push(res.data);
      return { ...problem, completions: records };
    }));
    return res;
  }, []);

  const saveProgress = useCallback(async (problemId, studentId, note) => {
    const res = await problemsApi.saveProgress(problemId, studentId, note);
    setProblems((prev) => prev.map((problem) => {
      if (problem._id !== problemId) return problem;
      const records = [...(problem.completions || [])];
      const index = records.findIndex((c) => c.studentId?._id?.toString() === studentId.toString());
      if (index >= 0) records[index] = res.data;
      else records.push(res.data);
      return { ...problem, completions: records };
    }));
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

  return { problems, loading, error, refetch: fetchProblems, completeProblem, saveProgress, addProblem, removeProblem };
};

export default useProblems;
