import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import KioskQrView from '../components/KioskQrView.jsx';

/** The demo has no real phone, so the scan succeeds by itself after this delay (or on tap). */
const AUTO_SCAN_MS = 4000;
const SUCCESS_HOLD_MS = 900;

export default function QrScan({ label, hint, next, nextState }) {
  const navigate = useNavigate();
  const embed = new URLSearchParams(useLocation().search).get('embed') === '1';
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    // Story iframes freeze on this beat — advancing is the presenter’s “다음”.
    if (embed) return undefined;
    if (scanned) {
      const id = setTimeout(() => navigate(next, { replace: true, state: nextState }), SUCCESS_HOLD_MS);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => setScanned(true), AUTO_SCAN_MS);
    return () => clearTimeout(id);
  }, [embed, scanned, navigate, next, nextState]);

  return (
    <KioskQrView label={label} hint={hint} scanned={scanned} onScan={() => setScanned(true)} />
  );
}
