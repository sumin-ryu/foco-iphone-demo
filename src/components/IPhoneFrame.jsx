import { useEffect, useState } from 'react';
import { BatteryIcon, SignalIcon, WifiIcon } from './icons.jsx';
import './IPhoneFrame.css';

export const PHONE_WIDTH = 421;
export const PHONE_HEIGHT = 880;

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 10_000);
    return () => clearInterval(id);
  }, []);
  const hours = now.getHours() % 12 || 12;
  return `${hours}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function SideButtons() {
  return (
    <>
      <span className="iphone__btn iphone__btn--action" />
      <span className="iphone__btn iphone__btn--vol-up" />
      <span className="iphone__btn iphone__btn--vol-down" />
      <span className="iphone__btn iphone__btn--power" />
    </>
  );
}

function ScreenOverlay() {
  const time = useClock();
  return (
    <>
      <div className="iphone__status">
        <span className="iphone__time">{time}</span>
        <span className="iphone__status-icons">
          <SignalIcon />
          <WifiIcon />
          <BatteryIcon />
        </span>
      </div>
      <div className="iphone__island" />
      <div className="iphone__home-indicator" />
    </>
  );
}

/**
 * The DOM structure around `children` stays identical whether the frame is
 * enabled or not, so toggling demo mode never remounts the app.
 */
export default function IPhoneFrame({ enabled, scale = 1, children }) {
  return (
    <div
      className={enabled ? 'iphone' : 'bare'}
      style={enabled ? { transform: `scale(${scale})` } : undefined}
    >
      {enabled && <SideButtons />}
      <div className={enabled ? 'iphone__screen' : 'bare__screen'}>
        <div className="iphone__content">{children}</div>
        {enabled && <ScreenOverlay />}
      </div>
    </div>
  );
}
