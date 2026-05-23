import { useEffect } from 'react';
import { toast } from 'sonner';

/**
 * Enterprise Anti-Theft Security Hook
 * Prevents competitors from easily scraping text, downloading luxury images, 
 * or inspecting the proprietary React codebase via Developer Tools.
 */
export const useAntiTheft = () => {
  useEffect(() => {
    // 1. Disable Context Menu (Right Click)
    const handleContextMenu = (e: MouseEvent) => {
      // Allow right-click in admin paths
      if (window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/sales')) {
        return;
      }
      e.preventDefault();
      toast.error('Proprietary Asset Protection', {
        description: 'Downloading images or copying content is restricted by copyright.',
      });
    };

    // 2. Disable Keyboard Shortcuts for Developer Tools
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow shortcuts in admin paths
      if (window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/sales')) {
        return;
      }

      // F12
      if (e.key === 'F12') {
        e.preventDefault();
      }
      // Ctrl+Shift+I (Windows/Linux Inspector) or Cmd+Option+I (Mac Inspector)
      if ((e.ctrlKey && e.shiftKey && e.key === 'I') || (e.metaKey && e.altKey && e.key === 'i')) {
        e.preventDefault();
      }
      // Ctrl+Shift+J (Console) or Cmd+Option+J (Mac Console)
      if ((e.ctrlKey && e.shiftKey && e.key === 'J') || (e.metaKey && e.altKey && e.key === 'j')) {
        e.preventDefault();
      }
      // Ctrl+U (View Source) or Cmd+Option+U (Mac Source)
      if ((e.ctrlKey && e.key === 'U') || (e.metaKey && e.altKey && e.key === 'u')) {
        e.preventDefault();
      }
      // Ctrl+C / Cmd+C (Copy Text)
      if ((e.ctrlKey && e.key === 'c') || (e.metaKey && e.key === 'c')) {
        const selection = window.getSelection()?.toString();
        if (selection && selection.length > 50) {
          e.preventDefault();
          toast.error('Content Protection', {
            description: 'Bulk copying of proprietary travel itineraries is prohibited.',
          });
        }
      }
    };

    // 3. Disable Dragging Images
    const handleDragStart = (e: DragEvent) => {
      if (e.target instanceof HTMLImageElement) {
        e.preventDefault();
      }
    };

    // Attach strict security event listeners globally
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('dragstart', handleDragStart);

    return () => {
      // Cleanup on unmount
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('dragstart', handleDragStart);
    };
  }, []);
};
