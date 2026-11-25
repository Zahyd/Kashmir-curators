import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { RESPONSIVE_TOKENS } from '@/lib/responsive';

interface ResponsiveWrapperProps {
  children: ReactNode;
  className?: string;
}

/**
 * Render children only on Mobile viewports (< 640px)
 */
export function MobileOnly({ children, className }: ResponsiveWrapperProps) {
  return (
    <div className={cn("block sm:hidden", className)}>
      {children}
    </div>
  );
}

/**
 * Render children only on Desktop viewports (>= 1024px)
 */
export function DesktopOnly({ children, className }: ResponsiveWrapperProps) {
  return (
    <div className={cn("hidden lg:block", className)}>
      {children}
    </div>
  );
}

/**
 * Render children on Tablet and Desktop viewports (>= 640px)
 */
export function TabletAndAbove({ children, className }: ResponsiveWrapperProps) {
  return (
    <div className={cn("hidden sm:block", className)}>
      {children}
    </div>
  );
}

/**
 * Unified Responsive Page/Section Container with standardized fluid horizontal padding
 */
export function ResponsiveContainer({ 
  children, 
  className,
  as: Component = 'div',
  dense = false
}: ResponsiveWrapperProps & { as?: any; dense?: boolean }) {
  return (
    <Component 
      className={cn(
        "w-full mx-auto",
        dense ? RESPONSIVE_TOKENS.densePadding : RESPONSIVE_TOKENS.pagePadding,
        className
      )}
    >
      {children}
    </Component>
  );
}

/**
 * Unified Smooth Mobile Horizontal Scroll Container (e.g. for tabs, pills, card carousels)
 * Strips native scrollbars while preserving touch momentum scroll on iOS/Android.
 */
export function ResponsiveScrollContainer({ 
  children, 
  className,
  showGutterOffset = true
}: ResponsiveWrapperProps & { showGutterOffset?: boolean }) {
  return (
    <div 
      className={cn(
        "overflow-x-auto no-scrollbar scroll-smooth flex items-center gap-2.5 py-1",
        showGutterOffset && "-mx-3.5 px-3.5 sm:mx-0 sm:px-0",
        className
      )}
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {children}
    </div>
  );
}

/**
 * Standardized Adaptive Responsive Grid
 */
export function ResponsiveGrid({
  children,
  className,
  columns = 3
}: ResponsiveWrapperProps & { columns?: 2 | 3 | 4 }) {
  const gridClasses = {
    2: RESPONSIVE_TOKENS.grid1to2,
    3: RESPONSIVE_TOKENS.grid1to3,
    4: RESPONSIVE_TOKENS.grid1to4
  }[columns];

  return (
    <div className={cn(gridClasses, className)}>
      {children}
    </div>
  );
}

/**
 * Responsive horizontal scroll container for wide tables on mobile & tablet viewports
 */
export function ResponsiveTableWrapper({ children, className }: ResponsiveWrapperProps) {
  return (
    <div
      className={cn(
        "relative w-full overflow-x-auto overscroll-x-contain custom-scrollbar",
        className
      )}
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {children}
    </div>
  );
}
