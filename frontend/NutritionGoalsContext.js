import React, { createContext, useState, useContext } from 'react';

const NutritionGoalsContext = createContext();

export const useNutritionGoals = () => {
  const context = useContext(NutritionGoalsContext);
  if (!context) {
    throw new Error('useNutritionGoals must be used within NutritionGoalsProvider');
  }
  return context;
};

export const NutritionGoalsProvider = ({ children }) => {
  const [goals, setGoals] = useState({
    calories: 2200,
    protein: 150,
    carbs: 250,
    fat: 80,
  });

  const updateGoals = (newGoals) => {
    setGoals({ ...goals, ...newGoals });
  };

  return (
    <NutritionGoalsContext.Provider value={{ goals, updateGoals }}>
      {children}
    </NutritionGoalsContext.Provider>
  );
};

