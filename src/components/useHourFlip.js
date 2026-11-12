import { useEffect, useRef, useState } from 'react';

const SWIPE_PX = 36;
const WHEEL_PX = 40;
const WHEEL_COOLDOWN = 450;

/** Vertical paging between hour bars by swipe, wheel or explicit `go(delta)`. */
export default function useHourFlip(count) {
  const [hour, setHour] = useState(0);
  const rootRef = useRef(null);
  const dragRef = useRef(null);
  const wheelRef = useRef({ sum: 0, lockedUntil: 0 });

  const go = (delta) => {
    const next = Math.min(count - 1, Math.max(0, hour + delta));
    if (next !== hour) setHour(next);
  };
  const goRef = useRef(go);
  useEffect(() => {
    goRef.current = go;
  });

  useEffect(() => {
    const el = rootRef.current;
    const onWheel = (e) => {
      e.preventDefault();
      const w = wheelRef.current;
      if (Date.now() < w.lockedUntil) return;
      w.sum += e.deltaY;
      if (Math.abs(w.sum) < WHEEL_PX) return;
      goRef.current(w.sum > 0 ? 1 : -1);
      w.sum = 0;
      w.lockedUntil = Date.now() + WHEEL_COOLDOWN;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const handlers = {
    onPointerDown: (e) => {
      dragRef.current = e.clientY;
    },
    onPointerUp: (e) => {
      if (dragRef.current == null) return;
      const dy = e.clientY - dragRef.current;
      dragRef.current = null;
      if (Math.abs(dy) >= SWIPE_PX) go(dy < 0 ? 1 : -1);
    },
    onPointerCancel: () => {
      dragRef.current = null;
    },
  };

  return { hour, go, rootRef, handlers };
}
