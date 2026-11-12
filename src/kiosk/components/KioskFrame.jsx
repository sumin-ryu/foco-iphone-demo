import './KioskFrame.css';

export const SCREEN_WIDTH = 540;
export const SCREEN_HEIGHT = 960;
const BEZEL_TOP = 56;
const BEZEL_SIDE = 28;
const PANEL_HEIGHT = 176;
const STAND_HEIGHT = 92;
export const DEVICE_WIDTH = SCREEN_WIDTH + BEZEL_SIDE * 2;
export const DEVICE_HEIGHT = BEZEL_TOP + SCREEN_HEIGHT + PANEL_HEIGHT + STAND_HEIGHT;

function HardwarePanel() {
  return (
    <div className="kiosk-device__panel" aria-hidden>
      <div className="kiosk-hw">
        <span className="kiosk-hw__scanner">
          <span className="kiosk-hw__scanner-beam" />
        </span>
        <span className="kiosk-hw__label">SCAN</span>
      </div>
      <div className="kiosk-hw">
        <span className="kiosk-hw__slot kiosk-hw__slot--card">
          <span className="kiosk-hw__led" />
        </span>
        <span className="kiosk-hw__label">CARD</span>
      </div>
      <div className="kiosk-hw">
        <span className="kiosk-hw__slot kiosk-hw__slot--receipt" />
        <span className="kiosk-hw__label">RECEIPT</span>
      </div>
      <span className="kiosk-device__brand">FOCO</span>
    </div>
  );
}

/**
 * The DOM structure around `children` stays identical whether the frame is
 * enabled or not, so toggling demo mode never remounts the kiosk app.
 */
export default function KioskFrame({ enabled, scale = 1, children }) {
  return (
    <div
      className={enabled ? 'kiosk-device' : 'kiosk-bare'}
      style={{
        transform: `scale(${scale})`,
        '--screen-width': `${SCREEN_WIDTH}px`,
        '--screen-height': `${SCREEN_HEIGHT}px`,
        '--bezel-top': `${BEZEL_TOP}px`,
        '--bezel-side': `${BEZEL_SIDE}px`,
        '--panel-height': `${PANEL_HEIGHT}px`,
        '--stand-height': `${STAND_HEIGHT}px`,
      }}
    >
      {enabled && <span className="kiosk-device__camera" aria-hidden />}
      <div className="kiosk-screen">{children}</div>
      {enabled && <HardwarePanel />}
      {enabled && <span className="kiosk-device__stand" aria-hidden />}
    </div>
  );
}
