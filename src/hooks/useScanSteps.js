import { useEffect, useRef, useState } from 'react';

/** The demo has no real camera, so the kiosk QR is "found" by itself after this delay (or on tap). */
const AUTO_DETECT_DELAY = 2600;
const MORPH_DELAY = 550;

/**
 * `scanning` → `detected` → `finalStep` (`connected` by default; check-in uses `linking`).
 * `onDetect` runs once when the QR is found.
 * Pass `autoDetect: false` (or `?hold=scan`) to keep the scanning UI for review.
 */
export function useScanSteps(initialStep, onDetect, finalStep = 'connected', { autoDetect = true } = {}) {
  const [step, setStep] = useState(initialStep);
  const stepRef = useRef(step);

  const detect = () => {
    if (stepRef.current !== 'scanning') return;
    stepRef.current = 'detected';
    setStep('detected');
    navigator.vibrate?.(30);
    onDetect();
    setTimeout(() => {
      stepRef.current = finalStep;
      setStep(finalStep);
    }, MORPH_DELAY);
  };

  useEffect(() => {
    if (!autoDetect || step !== 'scanning') return undefined;
    const id = setTimeout(detect, AUTO_DETECT_DELAY);
    return () => clearTimeout(id);
  }, [step, autoDetect]);

  return [step, detect];
}
