import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const [storedUser, storedToken] = await Promise.all([
        AsyncStorage.getItem('vytal_user'),
        AsyncStorage.getItem('vytal_token'),
      ]);
      if (storedUser && storedToken) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setToken(storedToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      }
    } catch (error) {
      console.error('Error restoring session:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (userData, authToken) => {
    try {
      await AsyncStorage.setItem('vytal_user', JSON.stringify(userData));
      await AsyncStorage.setItem('vytal_token', authToken);
      setUser(userData);
      setToken(authToken);
      if (authToken) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      }
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(['vytal_user', 'vytal_token']);
    } catch (error) {
      console.error('Error clearing session:', error);
    } finally {
      setUser(null);
      setToken(null);
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
