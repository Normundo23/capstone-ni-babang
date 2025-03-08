import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useStore } from '../store';

export const ThemeToggle: React.FC = () => {
  const { settings, updateSettings } = useStore();

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    updateSettings({ theme });
    
    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', isDark);
    } else {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  };

  return (
    <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-dark-800 rounded-lg">
      <button
        onClick={() => handleThemeChange('light')}
        className={`p-2 rounded-md transition-colors ${
          settings.theme === 'light'
            ? 'bg-white dark:bg-dark-700 text-amber-500 shadow-sm'
            : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-dark-700/50'
        }`}
        title="Light Mode"
      >
        <Sun size={20} />
      </button>
      <button
        onClick={() => handleThemeChange('dark')}
        className={`p-2 rounded-md transition-colors ${
          settings.theme === 'dark'
            ? 'bg-white dark:bg-dark-700 text-blue-500 shadow-sm'
            : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-dark-700/50'
        }`}
        title="Dark Mode"
      >
        <Moon size={20} />
      </button>
      <button
        onClick={() => handleThemeChange('system')}
        className={`p-2 rounded-md transition-colors ${
          settings.theme === 'system'
            ? 'bg-white dark:bg-dark-700 text-purple-500 shadow-sm'
            : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-dark-700/50'
        }`}
        title="System Theme"
      >
        <Monitor size={20} />
      </button>
    </div>
  );
};