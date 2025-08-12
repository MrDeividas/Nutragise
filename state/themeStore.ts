import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Color palette definitions
// Theme type definition
export interface Theme {
  // Backgrounds
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  
  // Text colors
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  
  // Primary brand colors
  primary: string;
  primaryDark: string;
  
  // UI elements
  border: string;
  borderSecondary: string;
  shadow: string;
  
  // Status bar
  statusBarStyle: 'dark-content' | 'light-content';
  
  // Tab bar
  tabBarActiveTint: string;
  tabBarInactiveTint: string;
  
  // Cards and containers
  cardBackground: string;
  
  // Icon colors
  iconPrimary: string;
  iconSecondary: string;
}

export const lightTheme: Theme = {
  // Backgrounds
  background: 'rgba(255, 255, 255, 0.3)',
  backgroundSecondary: 'rgba(249, 250, 251, 0.3)',
  backgroundTertiary: 'rgba(243, 244, 246, 0.3)',
  
  // Text colors
  textPrimary: '#1f2937',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  
  // Primary brand colors
  primary: '#129490',
  primaryDark: '#0f7a78',
  
  // UI elements
  border: 'rgba(229, 231, 235, 0.3)',
  borderSecondary: 'rgba(243, 244, 246, 0.3)',
  shadow: '#000000',
  
  // Status bar
  statusBarStyle: 'dark-content',
  
  // Tab bar
  tabBarActiveTint: '#129490',
  tabBarInactiveTint: '#6b7280',
  
  // Cards and containers
  cardBackground: 'rgba(255, 255, 255, 0.05)',
  
  // Icon colors
  iconPrimary: '#129490',
  iconSecondary: '#6b7280',
};

export const darkTheme: Theme = {
  // Backgrounds
  background: 'rgba(20, 19, 19, 0.3)',
  backgroundSecondary: 'rgba(20, 19, 19, 0.3)',
  backgroundTertiary: 'rgba(20, 19, 19, 0.3)',
  
  // Text colors
  textPrimary: '#f9fafb',
  textSecondary: '#d1d5db',
  textTertiary: '#9ca3af',
  
  // Primary brand colors
  primary: '#14b8a6',
  primaryDark: '#0d9488',
  
  // UI elements
  border: 'rgba(26, 26, 26, 0.3)',
  borderSecondary: 'rgba(26, 26, 26, 0.3)',
  shadow: '#000000',
  
  // Status bar
  statusBarStyle: 'light-content',
  
  // Tab bar
  tabBarActiveTint: '#14b8a6',
  tabBarInactiveTint: '#9ca3af',
  
  // Cards and containers
  cardBackground: 'rgba(255, 255, 255, 0.05)',
  
  // Icon colors
  iconPrimary: '#14b8a6',
  iconSecondary: '#9ca3af',
};

interface ThemeStore {
  isDark: boolean;
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      isDark: false,
      theme: lightTheme,
      
      toggleTheme: () => {
        const currentIsDark = get().isDark;
        const newIsDark = !currentIsDark;
        set({
          isDark: newIsDark,
          theme: newIsDark ? darkTheme : lightTheme,
        });
      },
      
      setTheme: (isDark: boolean) => {
        set({
          isDark,
          theme: isDark ? darkTheme : lightTheme,
        });
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Helper hook to get current theme colors
export const useTheme = () => {
  const { theme, isDark, toggleTheme } = useThemeStore();
  return { theme, isDark, toggleTheme };
}; 