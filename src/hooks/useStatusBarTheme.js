import { useEffect } from 'react';

const DARK_SCREEN_COLOR = '#1c1c1c';

/** Light status bar requests can overlap (e.g. the splash over a dark page), so the last one out restores. */
let lightCount = 0;
let previousColor;

/** Switches the status bar / home indicator to white while a dark screen is mounted. */
export function useStatusBarTheme(theme) {
  useEffect(() => {
    if (theme !== 'light') return undefined;
    const root = document.documentElement;
    const meta = document.querySelector('meta[name="theme-color"]');

    if (lightCount === 0) previousColor = meta?.content;
    lightCount += 1;
    root.dataset.statusBar = 'light';
    if (meta) meta.content = DARK_SCREEN_COLOR;

    return () => {
      lightCount -= 1;
      if (lightCount > 0) return;
      delete root.dataset.statusBar;
      if (meta && previousColor) meta.content = previousColor;
    };
  }, [theme]);
}
