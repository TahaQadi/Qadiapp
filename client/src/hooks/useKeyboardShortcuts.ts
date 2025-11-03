import { useEffect, useRef } from 'react';

interface KeyboardShortcutHandlers {
  onSearchFocus?: () => void;
  onCartToggle?: () => void;
  onEscape?: () => void;
}

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers): void {
  const handlersRef = useRef(handlers);

  // Update ref when handlers change
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;
      
      // Don't trigger shortcuts when user is typing in inputs
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || 
                     target.tagName === 'TEXTAREA' || 
                     target.isContentEditable;

      // Ctrl/Cmd + K: Focus search
      if (modKey && e.key === 'k' && !isInput) {
        e.preventDefault();
        handlersRef.current.onSearchFocus?.();
      }

      // Ctrl/Cmd + B: Toggle cart
      if (modKey && e.key === 'b' && !isInput) {
        e.preventDefault();
        handlersRef.current.onCartToggle?.();
      }

      // Esc: Close modals/dialogs
      if (e.key === 'Escape') {
        handlersRef.current.onEscape?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}

