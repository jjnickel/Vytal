import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

const ACCENT_KEY = 'vytal_accent_color';
const BG_KEY = 'vytal_bg_color';

const DEFAULT_ACCENT = '#6366F1';
const DEFAULT_BG = '#111827';

export const ThemeProvider = ({ children }) => {
  const [accentColor, setAccentColorState] = useState(DEFAULT_ACCENT);
  const [backgroundColor, setBackgroundColorState] = useState(DEFAULT_BG);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.multiGet([ACCENT_KEY, BG_KEY])
      .then(([[, accent], [, bg]]) => {
        if (accent) setAccentColorState(accent);
        if (bg) setBackgroundColorState(bg);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const setAccentColor = async (color) => {
    setAccentColorState(color);
    await AsyncStorage.setItem(ACCENT_KEY, color).catch(() => {});
  };

  const setBackgroundColor = async (color) => {
    setBackgroundColorState(color);
    await AsyncStorage.setItem(BG_KEY, color).catch(() => {});
  };

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
    <ThemeContext.Provider
      value={{
        accentColor,
        setAccentColor,
        accentColors,
        backgroundColor,
        setBackgroundColor,
        backgroundColors,
        themeLoaded: loaded,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
