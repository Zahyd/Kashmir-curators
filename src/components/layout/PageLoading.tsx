import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface PageLoadingProps {
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

export const PageLoading: React.FC<PageLoadingProps> = ({
  message = 'Loading workspace...',
  fullScreen = false,
  className,
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'w-full flex flex-col items-center justify-center p-6 sm:p-8 bg-background/60 backdrop-blur-sm',
        fullScreen ? 'min-h-[100dvh]' : 'min-h-[60dvh]',
        className,
      )}
    >
      <div className="relative flex items-center justify-center">
        <div className="absolute w-20 h-20 bg-amber-500/10 rounded-full blur-xl animate-pulse" />
        <div className="w-12 h-12 rounded-2xl bg-card border border-border/80 shadow-sm flex items-center justify-center relative">
          <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
        </div>
      </div>
      <p className="mt-4 text-xs font-medium tracking-wide uppercase text-muted-foreground/80 animate-pulse text-center">
        {message}
      </p>
    </div>
  );
};

/**
 * Shared responsive skeleton layout for lazy-loaded dashboard modules & portals.
 */
export const DashboardSkeleton: React.FC<{ message?: string; className?: string }> = ({
  message = 'Loading Live OS Module...',
  className,
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'min-h-[380px] rounded-2xl sm:rounded-3xl bg-card/70 border border-border/60 p-4 sm:p-6 space-y-5',
        className,
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-36 rounded-lg" />
          <Skeleton className="h-6 w-56 sm:w-72 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
            {message}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 sm:h-28 rounded-2xl" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="lg:col-span-2 h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    </div>
  );
};

export default PageLoading;
