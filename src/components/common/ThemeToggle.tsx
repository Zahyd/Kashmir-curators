import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <Button
      onClick={toggleTheme}
      variant="outline"
      size="icon"
      className={cn(
        "fixed bottom-24 right-6 z-50 w-12 h-12 rounded-full border shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110",
        isDark 
          ? "bg-[#0b1317]/90 border-white/20 text-amber-400 hover:bg-white/10" 
          : "bg-white border-slate-300 text-[#111439] hover:bg-slate-100 shadow-slate-900/10"
      )}
      title={isDark ? "Switch to Daylight Mode" : "Switch to Night Mode"}
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-amber-400 animate-spin-slow" />
      ) : (
        <Moon className="w-5 h-5 text-[#111439]" />
      )}
    </Button>
  );
}
