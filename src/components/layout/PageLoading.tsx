import React from 'react';
import { Loader2 } from 'lucide-react';

export const PageLoading: React.FC<{ message?: string }> = ({ message = 'Loading workspace...' }) => {
  return (
    <div className="min-h-[60vh] w-full flex flex-col items-center justify-center p-8 bg-background/50 backdrop-blur-sm">
      <div className="relative flex items-center justify-center">
        {/* Subtle ambient glow */}
        <div className="absolute w-20 h-20 bg-emerald-500/10 rounded-full blur-xl animate-pulse" />
        <div className="w-12 h-12 rounded-2xl bg-card border border-border/80 shadow-sm flex items-center justify-center relative">
          <Loader2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 animate-spin" />
        </div>
      </div>
      <p className="mt-4 text-xs font-medium tracking-wide uppercase text-muted-foreground/80 animate-pulse">
        {message}
      </p>
    </div>
  );
};

export default PageLoading;
