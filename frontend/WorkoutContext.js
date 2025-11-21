import React, { createContext, useState, useContext } from 'react';

const WorkoutContext = createContext();

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkout must be used within WorkoutProvider');
  }
  return context;
};

export const WorkoutProvider = ({ children }) => {
  const [pastWorkouts, setPastWorkouts] = useState([]);

  const addPastWorkout = (workout) => {
    setPastWorkouts([workout, ...pastWorkouts]);
  };

  return (
    <WorkoutContext.Provider value={{ pastWorkouts, addPastWorkout }}>
      {children}
    </WorkoutContext.Provider>
  );
};

