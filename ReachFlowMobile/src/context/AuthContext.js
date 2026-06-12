import React, { createContext, useContext, useEffect, useState } from 'react';
import { setToken } from '../api/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const savedUser = await AsyncStorage.getItem('user');
        const savedToken = await AsyncStorage.getItem('token');
        if (savedUser && savedToken) {
          setUser(JSON.parse(savedUser));
          setToken(savedToken);
        }
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (userData, token) => {
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    await AsyncStorage.setItem('token', token);
    setToken(token);
    setUser(userData);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const getToken = async () => {
    return await AsyncStorage.getItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

