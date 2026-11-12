import KioskFrame, { DEVICE_HEIGHT, DEVICE_WIDTH } from '../kiosk/components/KioskFrame.jsx';
import KioskQrView, { MEMBER_CHECK_IN } from '../kiosk/components/KioskQrView.jsx';
import './KioskScene.css';

const SCALE = 0.45;
/** Center of the kiosk's QR code, in unscaled device px from the top of the device. */
const QR_CENTER_Y = 473;
/** Center of the phone's scan frame, in px below the safe area (see `.checkin__frame`). */
const FRAME_CENTER_Y = 168 + 271 / 2;

/** Camera view of our kiosk showing a QR screen (`screen` is `{ label, hint }`, check-in by default). */
export default function KioskScene({ className = '', scanned = false, screen = MEMBER_CHECK_IN }) {
  return (
    <div className={`kiosk-scene ${className}`} aria-hidden>
      <div className="kiosk-scene__backdrop" />
      <div
        className="kiosk-scene__device"
        style={{
          top: `calc(var(--safe-top) + ${FRAME_CENTER_Y - QR_CENTER_Y * SCALE}px)`,
          width: DEVICE_WIDTH * SCALE,
          height: DEVICE_HEIGHT * SCALE,
          marginLeft: (-DEVICE_WIDTH * SCALE) / 2,
        }}
      >
        <KioskFrame enabled scale={SCALE}>
          <KioskQrView label={screen.label} hint={screen.hint} scanned={scanned} />
        </KioskFrame>
      </div>
    </div>
  );
}
