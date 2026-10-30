import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('dark');

  useEffect(() => {
    // Read saved theme from localStorage, default to 'dark' for Kashmir Curators aesthetic
    const savedTheme = (localStorage.getItem('KC_THEME') as Theme) || 'dark';
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem('KC_THEME', t);
    const root = document.documentElement;
    const body = document.body;

    if (t === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      body.classList.add('dark');
      body.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      body.classList.remove('dark');
      body.classList.add('light');
    }
  };

  const toggleTheme = () => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
  };

  const setTheme = (t: Theme) => {
    applyTheme(t);
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === 'dark', toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    // Graceful fallback if used outside provider
    const isDark = document.documentElement.classList.contains('dark');
    return {
      theme: (isDark ? 'dark' : 'light') as Theme,
      isDark,
      toggleTheme: () => {
        if (isDark) {
          document.documentElement.classList.remove('dark');
          document.body.classList.remove('dark');
          localStorage.setItem('KC_THEME', 'light');
        } else {
          document.documentElement.classList.add('dark');
          document.body.classList.add('dark');
          localStorage.setItem('KC_THEME', 'dark');
        }
      },
      setTheme: (t: Theme) => {
        if (t === 'dark') {
          document.documentElement.classList.add('dark');
          localStorage.setItem('KC_THEME', 'dark');
        } else {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('KC_THEME', 'light');
        }
      }
    };
  }
  return context;
};
