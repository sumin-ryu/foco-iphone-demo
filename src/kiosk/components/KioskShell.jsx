import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import DemoToggle, { useDemoMode } from '../../components/DemoToggle.jsx';
import KioskFrame, { DEVICE_HEIGHT, DEVICE_WIDTH, SCREEN_HEIGHT, SCREEN_WIDTH } from './KioskFrame.jsx';
import './KioskShell.css';

/** Bumped so a prior `?demo=off` embed that poisoned v1 doesn’t stick. */
const STORAGE_KEY = 'foco-kiosk:demo-mode-v2';
const STAGE_PADDING = 24;
const TOGGLE_AREA = 72;

function useViewport() {
  const read = () => ({ width: window.innerWidth, height: window.innerHeight });
  const [viewport, setViewport] = useState(read);
  useEffect(() => {
    const onResize = () => setViewport(read());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return viewport;
}

/** Demo mode never upscales the device; plain mode stretches the screen to fill the display. */
function getScale(demo, { width, height }) {
  if (!demo) return Math.min(width / SCREEN_WIDTH, height / SCREEN_HEIGHT);
  return Math.max(
    0.3,
    Math.min(
      1,
      (height - STAGE_PADDING * 2 - TOGGLE_AREA) / DEVICE_HEIGHT,
      (width - STAGE_PADDING * 2) / DEVICE_WIDTH,
    ),
  );
}

export default function KioskShell({ children }) {
  const [demo, setDemo] = useDemoMode(STORAGE_KEY);
  const scale = getScale(demo, useViewport());
  const width = demo ? DEVICE_WIDTH : SCREEN_WIDTH;
  const height = demo ? DEVICE_HEIGHT : SCREEN_HEIGHT;
  const embed = new URLSearchParams(useLocation().search).get('embed') === '1';

  // Host compare pages supply their own device chrome around the iframe.
  if (embed) {
    return (
      <div className="kiosk-stage kiosk-stage--plain kiosk-stage--embed">
        <div className="kiosk-stage__fit">{children}</div>
      </div>
    );
  }

  return (
    <div className={`kiosk-stage ${demo ? 'kiosk-stage--demo' : 'kiosk-stage--plain'}`}>
      <div className="kiosk-stage__fit" style={{ width: width * scale, height: height * scale }}>
        <KioskFrame enabled={demo} scale={scale}>
          {children}
        </KioskFrame>
      </div>
      <DemoToggle checked={demo} onChange={setDemo} />
    </div>
  );
}
