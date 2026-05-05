'use client';

import { useTheme } from './ThemeProvider';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-2xl border border-slate-200 dark:border-white/5 shadow-inner backdrop-blur-md transition-colors duration-500">
      <button
        onClick={() => setTheme('light')}
        className={`p-2.5 rounded-xl transition-all duration-300 ${
          theme === 'light' 
            ? 'bg-white text-accent shadow-lg scale-105' 
            : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
        }`}
        title="Light Mode"
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`p-2.5 rounded-xl transition-all duration-300 ${
          theme === 'dark' 
            ? 'bg-slate-700 text-accent shadow-lg border border-white/5 scale-105' 
            : 'text-slate-500 hover:text-white hover:bg-slate-700/30'
        }`}
        title="Dark Mode"
      >
        <Moon className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`p-2.5 rounded-xl transition-all duration-300 ${
          theme === 'system' 
            ? 'bg-slate-200 dark:bg-slate-600 text-accent shadow-lg border border-white/5 scale-105' 
            : 'text-slate-400 dark:text-slate-500 hover:text-primary hover:bg-white/10'
        }`}
        title="System Preference"
      >
        <Monitor className="w-4 h-4" />
      </button>
    </div>
  );
}
