import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const WorkoutContext = createContext();

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (!context) throw new Error('useWorkout must be used within WorkoutProvider');
  return context;
};

export const WorkoutProvider = ({ children }) => {
  const { user } = useAuth();
  const [pastWorkouts, setPastWorkouts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWorkouts = useCallback(async (userId) => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/workout-log/${userId}`);
      const logs = (res.data.logs || []).map((log) => ({
        id: log.id,
        date: new Date(log.date + 'T12:00:00Z').toLocaleDateString(),
        time: new Date(log.createdAt).toLocaleTimeString(),
        duration: '—',
        exercises: log.exercises || [],
        mode: 'custom',
        fromBackend: true,
      }));
      setPastWorkouts(logs);
    } catch (err) {
      console.error('Failed to load workouts:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchWorkouts(user.id);
    } else {
      setPastWorkouts([]);
    }
  }, [user?.id, fetchWorkouts]);

  const addPastWorkout = (workout) => {
    setPastWorkouts((prev) => [workout, ...prev]);
  };

  return (
    <WorkoutContext.Provider value={{ pastWorkouts, addPastWorkout, loading }}>
      {children}
    </WorkoutContext.Provider>
  );
};
