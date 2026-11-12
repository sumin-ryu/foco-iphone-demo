import { useEffect, useState, useSyncExternalStore } from 'react';

/** Demo fast-forward: 1 real second = 1 minute, so a 1H bar fills in a minute and a 4H pass in four. */
export const FAST_SPEED = 60;
const MIN_TICK = 100;

let speed = 1;
let anchorReal = Date.now();
let anchorClock = anchorReal;
const listeners = new Set();

/** App time. Runs `speed`× faster than the wall clock and never jumps back when the speed changes. */
export const clockNow = () => anchorClock + (Date.now() - anchorReal) * speed;

export function setClockSpeed(next) {
  anchorClock = clockNow();
  anchorReal = Date.now();
  speed = next;
  listeners.forEach((l) => l());
}

const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useClockSpeed = () => useSyncExternalStore(subscribe, () => speed);

/** Current app time that re-renders every `intervalMs` of app time (pass 0 to stop ticking). */
export function useNow(intervalMs = 1000) {
  const rate = useClockSpeed();
  const [now, setNow] = useState(clockNow);

  useEffect(() => {
    if (!intervalMs) return undefined;
    setNow(clockNow());
    const id = setInterval(() => setNow(clockNow()), Math.max(MIN_TICK, intervalMs / rate));
    return () => clearInterval(id);
  }, [intervalMs, rate]);

  return now;
}

export const formatElapsed = (ms) => {
  const total = Math.floor(ms / 1000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
};
