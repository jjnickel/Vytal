import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const WeightContext = createContext();

export const useWeight = () => {
  const context = useContext(WeightContext);
  if (!context) throw new Error('useWeight must be used within WeightProvider');
  return context;
};

export const WeightProvider = ({ children }) => {
  const { user } = useAuth();
  const [weightEntries, setWeightEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchEntries = useCallback(async (userId) => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/weight/${userId}`);
      const entries = (res.data.entries || []).map((e) => ({
        id: e.id,
        // MySQL returns date as a string "YYYY-MM-DD" — parse in UTC to avoid timezone shift
        date: new Date(e.date + 'T12:00:00Z'),
        weight: parseFloat(e.weight),
      }));
      setWeightEntries(entries);
    } catch (err) {
      console.error('Failed to load weight entries:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load when user logs in, clear when logged out
  useEffect(() => {
    if (user?.id) {
      fetchEntries(user.id);
    } else {
      setWeightEntries([]);
    }
  }, [user?.id, fetchEntries]);

  const addWeightEntry = async (weight) => {
    const today = new Date().toISOString().split('T')[0];
    const optimisticEntry = {
      id: `tmp-${Date.now()}`,
      date: new Date(today + 'T12:00:00Z'),
      weight: parseFloat(weight),
    };

    // Optimistic update
    setWeightEntries((prev) =>
      [...prev.filter((e) => e.date.toISOString().split('T')[0] !== today), optimisticEntry]
        .sort((a, b) => a.date - b.date)
    );

    if (user?.id) {
      try {
        const res = await axios.post('/api/weight', {
          userId: user.id,
          weight: parseFloat(weight),
          date: today,
        });
        // Replace optimistic entry with real one
        const saved = {
          id: res.data.entry?.id || optimisticEntry.id,
          date: new Date(today + 'T12:00:00Z'),
          weight: parseFloat(weight),
        };
        setWeightEntries((prev) =>
          prev.map((e) => (e.id === optimisticEntry.id ? saved : e))
        );
      } catch (err) {
        console.error('Failed to save weight entry:', err.message);
      }
    }
  };

  return (
    <WeightContext.Provider value={{ weightEntries, addWeightEntry, loading }}>
      {children}
    </WeightContext.Provider>
  );
};
