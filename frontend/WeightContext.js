import React, { createContext, useState, useContext } from 'react';

const WeightContext = createContext();

export const useWeight = () => {
  const context = useContext(WeightContext);
  if (!context) {
    throw new Error('useWeight must be used within WeightProvider');
  }
  return context;
};

export const WeightProvider = ({ children }) => {
  // Mock initial weight data - in a real app this would come from storage/API
  const [weightEntries, setWeightEntries] = useState([
    { id: 1, date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), weight: 180 },
    { id: 2, date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), weight: 179 },
    { id: 3, date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), weight: 178.5 },
    { id: 4, date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), weight: 177.5 },
    { id: 5, date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), weight: 177 },
    { id: 6, date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), weight: 176.5 },
    { id: 7, date: new Date(), weight: 176 },
  ]);

  const addWeightEntry = (weight) => {
    const newEntry = {
      id: Date.now(),
      date: new Date(),
      weight: parseFloat(weight),
    };
    setWeightEntries([...weightEntries, newEntry].sort((a, b) => a.date - b.date));
  };

  return (
    <WeightContext.Provider value={{ weightEntries, addWeightEntry }}>
      {children}
    </WeightContext.Provider>
  );
};

