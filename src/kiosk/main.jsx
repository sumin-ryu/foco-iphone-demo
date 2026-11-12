import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import KioskApp from './KioskApp.jsx';
import '../styles/global.css';
import './kiosk.css';

// A kiosk has no address bar, so navigation lives in memory.
// Story iframes use `/kiosk/?to=/member&embed=1` (Vite MPA can’t deep-link `/kiosk/member`).
function initialEntry() {
  const q = new URLSearchParams(window.location.search);
  const to = q.get('to');
  const pathname = to?.startsWith('/') ? to : '/';
  const search = window.location.search;
  const state = {};
  if (q.get('member') === '1') state.member = true;
  if (q.get('hours')) state.hours = Number(q.get('hours'));
  if (q.get('seat')) state.seat = q.get('seat');
  return { pathname, search, state: Object.keys(state).length ? state : null };
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MemoryRouter initialEntries={[initialEntry()]}>
      <KioskApp />
    </MemoryRouter>
  </StrictMode>,
);
