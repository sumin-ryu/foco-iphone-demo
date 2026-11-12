import { useEffect } from 'react';
import { useStatusBarTheme } from './useStatusBarTheme.js';
import '../styles/darkScreen.css';

/** Turns the whole app screen dark (like the focus screen) while the calling page is mounted. */
export function useDarkScreen() {
  useStatusBarTheme('light');
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.screen = 'dark';
    return () => {
      delete root.dataset.screen;
    };
  }, []);
}
