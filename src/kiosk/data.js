import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export { PASS_TYPES, USER, formatWon, getPassLevel } from '../store/AppStore.jsx';
export { seatLabel } from '../data/seats.js';

/** Passes the demo member already owns, by hours. */
export const MEMBER_PASSES = { 1: 0, 2: 2, 4: 0, 6: 0, 8: 3 };

/** The member checking out in the demo flow. */
export const DEMO_CHECK_OUT = { seat: 'A12', minutesUsed: 130 };

export const toClock = (date) =>
  `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

export const formatDuration = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m}분`;
  return m ? `${h}시간 ${m}분` : `${h}시간`;
};

/**
 * Counts down from `seconds` and then sends the kiosk back to the home screen.
 * Pass `null` / `0` to freeze (story embeds).
 */
export function useAutoReturn(seconds) {
  const navigate = useNavigate();
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (seconds == null || seconds <= 0) return undefined;
    if (left <= 0) {
      navigate('/', { replace: true });
      return undefined;
    }
    const id = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds, left, navigate]);
  return left;
}
