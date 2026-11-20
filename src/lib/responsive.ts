/**
 * Kashmir Curators - Unified Mobile & Responsive Design Architecture
 * Single Source of Truth for Breakpoints, Spacing, Touch Targets, and Viewport Insets.
 */

export const BREAKPOINTS = {
  compact: 390,  // Small phones (iPhone SE, Galaxy S, folded displays)
  mobile: 640,   // Standard mobile phone viewport threshold
  tablet: 768,   // Mini tablets / large phablets
  desktop: 1024, // Tablets landscape / small laptops
  wide: 1280,    // Standard desktop displays
  ultrawide: 1536 // Ultra-wide monitors
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

/**
 * Standardized Responsive Tokens for Layouts, Paddings, and Gutters
 * Use these across any page, card, modal, or component for guaranteed visual rhythm.
 */
export const RESPONSIVE_TOKENS = {
  // Page Container Gutters (fluid horizontal padding)
  pagePadding: "px-3.5 sm:px-6 md:px-8 lg:px-12 xl:px-16",
  
  // Dense Container Gutters (for portals, modals, dashboards)
  densePadding: "px-3 sm:px-4 md:px-6",

  // Vertical Section Spacing
  sectionSpacing: "py-8 sm:py-12 md:py-16 lg:py-20",
  
  // Card Internal Padding
  cardPadding: "p-3.5 sm:p-5 md:p-6",
  compactCardPadding: "p-3 sm:p-4",

  // Touch Ergonomics (Apple Human Interface Guidelines & Google Material 44-48px touch targets)
  touchTarget: "min-h-[44px] min-w-[44px]",
  buttonHeight: "h-11 sm:h-12",
  compactButtonHeight: "h-9 sm:h-10",

  // Mobile Safe Area Inset Classes (for iPhone Home Bar / Notch)
  safeBottom: "pb-[calc(1rem+env(safe-area-inset-bottom,0px))]",
  safeTop: "pt-[calc(1rem+env(safe-area-inset-top,0px))]",

  // Mobile Clean Horizontal Scroll (for category tabs, filter chips, tag clouds)
  horizontalScroll: "overflow-x-auto no-scrollbar scroll-smooth flex items-center -mx-3.5 px-3.5 sm:mx-0 sm:px-0",

  // Mobile Bottom Sheet / Modal Sizing
  modalWidth: "w-[94vw] sm:max-w-lg md:max-w-2xl lg:max-w-4xl",
  
  // Viewport Height (iOS Safari dynamic toolbar aware)
  fullViewportHeight: "min-h-[100dvh] h-[100dvh]",
  screenHeight: "min-h-[100dvh]",

  // Grid Layout Defaults
  grid1to2: "grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6",
  grid1to3: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6",
  grid1to4: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6",
} as const;

/**
 * Helper to check current media query dynamically
 */
export const isClient = typeof window !== 'undefined';

export const getDeviceDimensions = () => {
  if (!isClient) {
    return { width: 1200, height: 800 };
  }
  return {
    width: window.innerWidth,
    height: window.innerHeight
  };
};
