import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/AppStore.jsx';

const HOUR = 60 * 60 * 1000;

/**
 * A focus session can't outlast its pass. When the pass runs out while another screen is
 * open, this sends the user to the focus screen, which wraps the session up.
 */
export function usePassExpiry() {
  const { session, focus } = useAppStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const endsAt = session && focus ? focus.startedAt + session.passHours * HOUR : null;

  useEffect(() => {
    if (endsAt == null || pathname === '/focus') return undefined;
    const id = setTimeout(() => navigate('/focus', { replace: true }), Math.max(0, endsAt - Date.now()));
    return () => clearTimeout(id);
  }, [endsAt, pathname, navigate]);
}
