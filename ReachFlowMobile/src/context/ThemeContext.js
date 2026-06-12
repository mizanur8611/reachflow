import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const themes = {
  dark: {
    name: 'Dark',
    icon: '🌙',
    background: '#0a0a0a',
    card: '#141417',
    border: '#1f1f23',
    text: '#f4f4f5',
    subtext: '#71717a',
    primary: '#8b5cf6',
    primaryLight: '#1a1425',
    inputBg: '#141417',
    headerBg: '#0a0a0a',
    tabBg: '#0f0f12',
  },
  light: {
    name: 'Light',
    icon: '☀️',
    background: '#ffffff',
    card: '#f9fafb',
    border: '#e5e7eb',
    text: '#1a1a2e',
    subtext: '#6b7280',
    primary: '#7C3AED',
    primaryLight: '#f3f0ff',
    inputBg: '#f9fafb',
    headerBg: '#ffffff',
    tabBg: '#ffffff',
  },
  purple: {
    name: 'Purple',
    icon: '💜',
    background: '#f5f3ff',
    card: '#ffffff',
    border: '#ddd6fe',
    text: '#1e1b4b',
    subtext: '#6d28d9',
    primary: '#7C3AED',
    primaryLight: '#ede9fe',
    inputBg: '#ffffff',
    headerBg: '#7C3AED',
    tabBg: '#ffffff',
  },
};

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState('dark');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem('theme');
        if (saved && themes[saved]) setThemeName(saved);
      } catch (e) {}
    };
    loadTheme();
  }, []);

  const setTheme = async (name) => {
    setThemeName(name);
    await AsyncStorage.setItem('theme', name);
  };

  return (
    <ThemeContext.Provider value={{ theme: themes[themeName], themeName, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}


