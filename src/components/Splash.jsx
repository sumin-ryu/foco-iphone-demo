import { useEffect, useState } from 'react';
import { FocoWordmark } from './icons.jsx';
import { useStatusBarTheme } from '../hooks/useStatusBarTheme.js';
import './Splash.css';

const HOLD_MS = 2000;
const FADE_MS = 450;

function SplashScreen({ leaving, onSkip }) {
  useStatusBarTheme('light');
  return (
    <div
      className={`splash ${leaving ? 'splash--leaving' : ''}`}
      style={{ '--fade': `${FADE_MS}ms` }}
      onClick={onSkip}
      aria-hidden
    >
      <FocoWordmark width={226} className="splash__wordmark" />
    </div>
  );
}

/** Launch screen shown once per app load over whatever route opens first. Tap to skip. */
export default function Splash() {
  const skipSplash =
    typeof window !== 'undefined' &&
    (() => {
      const q = new URLSearchParams(window.location.search);
      return (
        q.get('splash') === '0' ||
        q.get('embed') === '1' ||
        window.location.pathname.startsWith('/compare')
      );
    })();
  const [phase, setPhase] = useState(skipSplash ? 'gone' : 'show');

  useEffect(() => {
    if (phase === 'gone') return undefined;
    const id =
      phase === 'show'
        ? setTimeout(() => setPhase('leaving'), HOLD_MS)
        : setTimeout(() => setPhase('gone'), FADE_MS);
    return () => clearTimeout(id);
  }, [phase]);

  if (phase === 'gone') return null;
  return <SplashScreen leaving={phase === 'leaving'} onSkip={() => setPhase('leaving')} />;
}
