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
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="group relative w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 shadow-2xl transition-all duration-500 active:scale-90"
      title={theme === 'dark' ? 'Ganti ke Terang' : 'Ganti ke Gelap'}
    >
      <div className="relative w-6 h-6 overflow-hidden">
        <Sun className={`absolute inset-0 w-6 h-6 text-yellow-400 transition-all duration-700 transform ${theme === 'dark' ? 'translate-y-10 opacity-0 rotate-90' : 'translate-y-0 opacity-100 rotate-0'}`} />
        <Moon className={`absolute inset-0 w-6 h-6 text-blue-400 transition-all duration-700 transform ${theme === 'dark' ? 'translate-y-0 opacity-100 rotate-0' : '-translate-y-10 opacity-0 -rotate-90'}`} />
      </div>
      
      {/* Decorative pulse effect */}
      <div className={`absolute inset-0 rounded-2xl bg-accent/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${theme === 'dark' ? 'bg-blue-500/20' : 'bg-yellow-500/20'}`}></div>
    </button>
  );
}
