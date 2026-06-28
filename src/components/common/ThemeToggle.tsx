import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function ThemeToggle() {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('KC_THEME');
    if (savedTheme === 'light') {
      setIsLight(true);
      document.body.classList.add('light-theme');
    }
  }, []);

  const toggleTheme = () => {
    if (isLight) {
      document.body.classList.remove('light-theme');
      localStorage.setItem('KC_THEME', 'dark');
      setIsLight(false);
    } else {
      document.body.classList.add('light-theme');
      localStorage.setItem('KC_THEME', 'light');
      setIsLight(true);
    }
  };

  return (
    <Button
      onClick={toggleTheme}
      variant="outline"
      size="icon"
      className={cn(
        "fixed bottom-24 right-6 z-50 w-12 h-12 rounded-full border shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110",
        isLight 
          ? "bg-white border-slate-200 text-amber-500 hover:bg-slate-100" 
          : "bg-[#0b1317]/90 border-white/10 text-kashmir-gold hover:bg-white/10"
      )}
      title={isLight ? "Activate Night Mode" : "Activate Daylight Mode"}
    >
      {isLight ? <Moon className="w-5 h-5 animate-bounce" /> : <Sun className="w-5 h-5 animate-spin-slow" />}
    </Button>
  );
}
