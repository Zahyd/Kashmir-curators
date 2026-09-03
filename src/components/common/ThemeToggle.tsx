import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('KC_THEME');
    if (savedTheme === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      localStorage.setItem('KC_THEME', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      localStorage.setItem('KC_THEME', 'dark');
      setIsDark(true);
    }
  };

  return (
    <Button
      onClick={toggleTheme}
      variant="outline"
      size="icon"
      className={cn(
        "fixed bottom-24 right-6 z-50 w-12 h-12 rounded-full border shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110",
        isDark 
          ? "bg-[#0b1317]/90 border-white/10 text-amber-400 hover:bg-white/10" 
          : "bg-white border-slate-200 text-[#111439] hover:bg-slate-100"
      )}
      title={isDark ? "Activate Daylight Mode" : "Activate Night Mode"}
    >
      {isDark ? <Sun className="w-5 h-5 text-amber-400 animate-spin-slow" /> : <Moon className="w-5 h-5 text-[#111439] animate-bounce" />}
    </Button>
  );
}
