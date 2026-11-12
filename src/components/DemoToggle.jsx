import { useEffect, useState } from 'react';
import './DemoToggle.css';

/**
 * `?demo=on|off` overrides the remembered preference for this page load only
 * (embeds / story iframes). Those overrides must not write back to localStorage,
 * or opening `/kiosk/?demo=off&embed=1` would turn demo off for the next visit.
 */
export function useDemoMode(storageKey) {
  const [fromUrl] = useState(() => {
    const param = new URLSearchParams(window.location.search).get('demo');
    return param === 'on' || param === 'off' ? param : null;
  });
  const [demo, setDemo] = useState(() => {
    if (fromUrl) return fromUrl === 'on';
    return localStorage.getItem(storageKey) !== 'off';
  });
  useEffect(() => {
    if (fromUrl) return;
    localStorage.setItem(storageKey, demo ? 'on' : 'off');
  }, [demo, storageKey, fromUrl]);
  return [demo, setDemo];
}

/**
 * Pill switch under the device frame. With the frame off it shrinks (`compact`) and floats
 * in a corner (`floating`), unless a parent positions it.
 */
export default function DemoToggle({
  checked,
  onChange,
  label = '시연 모드',
  floating = !checked,
  compact = floating,
}) {
  const className = [
    'demo-toggle',
    floating && 'demo-toggle--floating',
    compact && 'demo-toggle--compact',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={className}>
      <span className="demo-toggle__label">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className="demo-toggle__switch"
        onClick={() => onChange(!checked)}
      >
        <span className="demo-toggle__thumb" />
      </button>
    </div>
  );
}
