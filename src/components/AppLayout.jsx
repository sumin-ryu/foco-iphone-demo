import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigationType } from 'react-router-dom';
import BottomNav from './BottomNav.jsx';
import { usePassExpiry } from '../hooks/usePassExpiry.js';
import './AppLayout.css';

let isInitialLoad = true;

function getTransition(navigationType, { withNav, fullscreen, dark }) {
  if (isInitialLoad) return 'fade';
  if (navigationType === 'POP') return 'back';
  if (fullscreen && dark) return 'up';
  return withNav ? 'fade' : 'forward';
}

/**
 * `overlay` (passed through Outlet context) is a layer outside the scroll area,
 * for floating UI that must not scroll or move with page transitions.
 */
export default function AppLayout({ withNav = false, fullscreen = false, dark = false }) {
  const scrollRef = useRef(null);
  const [overlay, setOverlay] = useState(null);
  const { pathname } = useLocation();
  const navigationType = useNavigationType();
  const transition = getTransition(navigationType, { withNav, fullscreen, dark });
  usePassExpiry();

  useEffect(() => {
    isInitialLoad = false;
    scrollRef.current?.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div
      className={['app', fullscreen && 'app--fullscreen', dark && 'app--dark']
        .filter(Boolean)
        .join(' ')}
    >
      <main
        ref={scrollRef}
        className={`app__scroll ${withNav ? 'app__scroll--with-nav' : ''}`}
      >
        <div key={pathname} className={`page-transition page-transition--${transition}`}>
          <Outlet context={{ overlay }} />
        </div>
      </main>
      {!fullscreen && <div className="app__status-backdrop" />}
      {withNav && (
        <>
          <div className="app__nav-fade" />
          <BottomNav />
        </>
      )}
      <div ref={setOverlay} className="app__overlay" />
    </div>
  );
}
