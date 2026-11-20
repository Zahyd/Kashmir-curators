import { useState, useEffect } from 'react';
import { BREAKPOINTS, getDeviceDimensions, isClient } from '@/lib/responsive';

export interface ResponsiveState {
  width: number;
  height: number;
  isCompact: boolean;   // < 390px (iPhone SE, compact foldables)
  isMobile: boolean;    // < 640px (All standard smartphones)
  isTablet: boolean;    // 640px - 1023px (iPads, foldables, tablets)
  isDesktop: boolean;   // >= 1024px (Laptops & desktops)
  isWide: boolean;      // >= 1280px (Large monitors)
  orientation: 'portrait' | 'landscape';
  isTouch: boolean;
}

export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(() => {
    const { width, height } = getDeviceDimensions();
    const isTouch = isClient ? ('ontouchstart' in window || navigator.maxTouchPoints > 0) : false;
    
    return {
      width,
      height,
      isCompact: width < BREAKPOINTS.compact,
      isMobile: width < BREAKPOINTS.mobile,
      isTablet: width >= BREAKPOINTS.mobile && width < BREAKPOINTS.desktop,
      isDesktop: width >= BREAKPOINTS.desktop,
      isWide: width >= BREAKPOINTS.wide,
      orientation: height > width ? 'portrait' : 'landscape',
      isTouch
    };
  });

  useEffect(() => {
    if (!isClient) return;

    let timeoutId: any = null;

    const handleResize = () => {
      // Debounce window resize to ensure 60fps smoothness during fluid browser resizing
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        setState({
          width,
          height,
          isCompact: width < BREAKPOINTS.compact,
          isMobile: width < BREAKPOINTS.mobile,
          isTablet: width >= BREAKPOINTS.mobile && width < BREAKPOINTS.desktop,
          isDesktop: width >= BREAKPOINTS.desktop,
          isWide: width >= BREAKPOINTS.wide,
          orientation: height > width ? 'portrait' : 'landscape',
          isTouch
        });
      }, 50);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return state;
}
