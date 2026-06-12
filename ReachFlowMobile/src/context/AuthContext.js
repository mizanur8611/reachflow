import React, { createContext, useContext, useEffect, useState } from 'react';
import { setToken } from '../api/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, _setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const savedUser = await AsyncStorage.getItem('user');
        const savedToken = await AsyncStorage.getItem('token');
        if (savedUser && savedToken) {
          _setUser(JSON.parse(savedUser));
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

  const setUser = async (userData) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
    } catch (e) {
      console.log(e);
    }
    _setUser(userData);
  };

  const login = async (userData, token) => {
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    await AsyncStorage.setItem('token', token);
    setToken(token);
    _setUser(userData);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('token');
    setToken(null);
    _setUser(null);
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








