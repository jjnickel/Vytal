import React, { createContext, useState, useContext } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [accentColor, setAccentColor] = useState('#6366F1'); // Default indigo
  const [backgroundColor, setBackgroundColor] = useState('#111827'); // Default dark gray

  const accentColors = [
    { name: 'Indigo', value: '#6366F1' },
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Orange', value: '#F97316' },
    { name: 'Green', value: '#10B981' },
    { name: 'Teal', value: '#14B8A6' },
  ];

  const backgroundColors = [
    { name: 'Dark Gray', value: '#111827' },
    { name: 'Black', value: '#000000' },
    { name: 'Navy', value: '#0F172A' },
    { name: 'Charcoal', value: '#1C1C1E' },
    { name: 'Slate', value: '#1E293B' },
  ];

  return (
    <ThemeContext.Provider value={{ 
      accentColor, 
      setAccentColor, 
      accentColors,
      backgroundColor,
      setBackgroundColor,
      backgroundColors,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

