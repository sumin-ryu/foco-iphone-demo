import { useEffect, useState } from 'react';
import KioskFrame, {
  DEVICE_HEIGHT,
  DEVICE_WIDTH,
} from '../kiosk/components/KioskFrame.jsx';
import './OnboardingAlignCompare.css';

const STAGE_PADDING = 24;
const LABEL_AREA = 72;
const GAP = 32;

function useDualFitScale() {
  const compute = () =>
    Math.min(
      1,
      (window.innerHeight - STAGE_PADDING * 2 - LABEL_AREA) / DEVICE_HEIGHT,
      (window.innerWidth - STAGE_PADDING * 2 - GAP) / (DEVICE_WIDTH * 2),
    );
  const [scale, setScale] = useState(compute);
  useEffect(() => {
    const onResize = () => setScale(compute());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return Math.max(scale, 0.22);
}

function KioskSlot({ label, src, scale }) {
  return (
    <figure className="align-compare__slot">
      <figcaption>{label}</figcaption>
      <div
        className="align-compare__device"
        style={{ width: DEVICE_WIDTH * scale, height: DEVICE_HEIGHT * scale }}
      >
        <KioskFrame enabled scale={scale}>
          <iframe className="align-compare__frame" title={label} src={src} />
        </KioskFrame>
      </div>
    </figure>
  );
}

/** Side-by-side: gray check-out (legacy) vs equal navy actions (current). */
export default function KioskHomeCompare() {
  const scale = useDualFitScale();
  const qs = 'demo=off&embed=1';

  return (
    <div className="align-compare">
      <header className="align-compare__header">
        <h1>키오스크 홈 비교</h1>
        <p>시연 · 퇴실 버튼 회색(기존) vs 입실·퇴실 동일(지금)</p>
      </header>
      <div className="align-compare__grid">
        <KioskSlot
          label="기존 (퇴실 회색)"
          src={`/kiosk/?${qs}&style=legacy`}
          scale={scale}
        />
        <KioskSlot
          label="지금 (둘 다 네이비)"
          src={`/kiosk/?${qs}`}
          scale={scale}
        />
      </div>
    </div>
  );
}
