// src/hooks/useLeaderboard.js

import { useState, useEffect, useCallback } from 'react';
import { leaderboardApi } from '../services/api';

const useLeaderboard = () => {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [asOf, setAsOf] = useState(null);
  const [groupStats, setGroupStats] = useState(null);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await leaderboardApi.get();
      setRankings(res.data || []);
      setAsOf(res.asOf);
      setGroupStats(res.groupStats || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  useEffect(() => {
    const interval = setInterval(fetchLeaderboard, 60000);
    return () => clearInterval(interval);
  }, [fetchLeaderboard]);

  return { rankings, groupStats, loading, error, asOf, refetch: fetchLeaderboard };
};

export default useLeaderboard;
