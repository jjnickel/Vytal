import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NutritionGoalsContext = createContext();

const STORAGE_KEY = 'vytal_nutrition_goals';

const DEFAULT_GOALS = {
  calories: 2200,
  protein: 150,
  carbs: 250,
  fat: 80,
};

export const useNutritionGoals = () => {
  const context = useContext(NutritionGoalsContext);
  if (!context) throw new Error('useNutritionGoals must be used within NutritionGoalsProvider');
  return context;
};

export const NutritionGoalsProvider = ({ children }) => {
  const [goals, setGoals] = useState(DEFAULT_GOALS);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored) setGoals(JSON.parse(stored));
      })
      .catch(() => {});
  }, []);

  const updateGoals = async (newGoals) => {
    const updated = { ...goals, ...newGoals };
    setGoals(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
  };

  return (
    <NutritionGoalsContext.Provider value={{ goals, updateGoals }}>
      {children}
    </NutritionGoalsContext.Provider>
  );
};
