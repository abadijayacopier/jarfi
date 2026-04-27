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
    <div className="flex items-center gap-1 bg-slate-900/50 dark:bg-black/20 p-1 rounded-xl border border-white/10 shadow-inner backdrop-blur-md">
      <button
        onClick={() => setTheme('light')}
        className={`p-2 rounded-lg transition-all ${
          theme === 'light' 
            ? 'bg-white text-indigo-600 shadow-md' 
            : 'text-slate-500 hover:text-white hover:bg-white/5'
        }`}
        title="Light Mode"
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`p-2 rounded-lg transition-all ${
          theme === 'dark' 
            ? 'bg-slate-800 text-indigo-400 shadow-md border border-white/10' 
            : 'text-slate-500 hover:text-white hover:bg-white/5'
        }`}
        title="Dark Mode"
      >
        <Moon className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`p-2 rounded-lg transition-all ${
          theme === 'system' 
            ? 'bg-slate-700/50 text-indigo-300 shadow-md border border-white/10' 
            : 'text-slate-500 hover:text-white hover:bg-white/5'
        }`}
        title="System Preference"
      >
        <Monitor className="w-4 h-4" />
      </button>
    </div>
  );
}
