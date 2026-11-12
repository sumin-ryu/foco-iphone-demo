import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import IPhoneFrame, { PHONE_HEIGHT, PHONE_WIDTH } from '../components/IPhoneFrame.jsx';
import KioskFrame, {
  DEVICE_HEIGHT,
  DEVICE_WIDTH,
} from '../kiosk/components/KioskFrame.jsx';
import {
  CHECK_IN_STORY_SCENES,
  checkInKioskUrl,
  checkInPhoneUrl,
} from '../data/checkInStory.js';
import './CheckInStory.css';

const STAGE_PADDING = 24;
const CHROME = 140;
const GAP = 28;

function useDualScale(kioskOpen) {
  const compute = () => {
    const phoneW = PHONE_WIDTH;
    const kioskW = kioskOpen ? DEVICE_WIDTH : 0;
    const gap = kioskOpen ? GAP : 0;
    const totalW = phoneW + kioskW + gap;
    const maxH = Math.max(PHONE_HEIGHT, kioskOpen ? DEVICE_HEIGHT : 0);
    return Math.min(
      0.62,
      (window.innerHeight - STAGE_PADDING * 2 - CHROME) / maxH,
      (window.innerWidth - STAGE_PADDING * 2) / totalW,
    );
  };
  const [scale, setScale] = useState(compute);
  useEffect(() => {
    const onResize = () => setScale(compute());
    window.addEventListener('resize', onResize);
    setScale(compute());
    return () => window.removeEventListener('resize', onResize);
  }, [kioskOpen]);
  return Math.max(scale, 0.22);
}

/** Side-by-side phone + kiosk check-in story. Kiosk can be dismissed after 입실 완료. */
export default function CheckInStory() {
  const [index, setIndex] = useState(0);
  const [kioskDismissed, setKioskDismissed] = useState(false);
  const scene = CHECK_IN_STORY_SCENES[index];
  const kioskOpen = scene.showKiosk && !kioskDismissed;
  const scale = useDualScale(kioskOpen);

  useEffect(() => {
    // Coming back from the done scene restores the kiosk for earlier beats.
    if (!scene.canDismissKiosk) setKioskDismissed(false);
  }, [scene.canDismissKiosk, scene.id]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(CHECK_IN_STORY_SCENES.length - 1, i + 1));
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className={`checkin-story ${kioskOpen ? '' : 'checkin-story--phone-only'}`}>
      <header className="checkin-story__header">
        <div className="checkin-story__heading">
          <p className="checkin-story__kicker">
            입실 스토리 {index + 1} / {CHECK_IN_STORY_SCENES.length}
          </p>
          <h1 className="checkin-story__title">{scene.title}</h1>
          <p className="checkin-story__caption">
            {scene.caption.map((line) => (
              <span key={line} className="checkin-story__caption-line">
                {line}
              </span>
            ))}
          </p>
        </div>
        <Link to="/" className="checkin-story__back" replace>
          홈으로
        </Link>
      </header>

      <div className="checkin-story__stage">
        <figure className="checkin-story__slot">
          <figcaption>폰</figcaption>
          <div
            className="checkin-story__device"
            style={{ width: PHONE_WIDTH * scale, height: PHONE_HEIGHT * scale }}
          >
            <IPhoneFrame enabled scale={scale}>
              <iframe
                key={`phone-${scene.id}`}
                className="checkin-story__frame"
                title="폰 · 체크인"
                src={checkInPhoneUrl(scene)}
              />
            </IPhoneFrame>
          </div>
        </figure>

        {kioskOpen && (
          <figure className="checkin-story__slot checkin-story__slot--kiosk">
            <figcaption>키오스크</figcaption>
            <div
              className="checkin-story__device"
              style={{ width: DEVICE_WIDTH * scale, height: DEVICE_HEIGHT * scale }}
            >
              <KioskFrame enabled scale={scale}>
                <iframe
                  key={`kiosk-${scene.id}`}
                  className="checkin-story__frame checkin-story__frame--kiosk"
                  title="키오스크 · 입실"
                  src={checkInKioskUrl(scene)}
                />
              </KioskFrame>
            </div>
          </figure>
        )}
      </div>

      <nav className="checkin-story__nav" aria-label="입실 스토리 장면">
        <button
          type="button"
          className="checkin-story__btn"
          disabled={index === 0}
          onClick={() => setIndex((i) => i - 1)}
        >
          이전
        </button>

        <ol className="checkin-story__dots">
          {CHECK_IN_STORY_SCENES.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                className={`checkin-story__dot ${i === index ? 'is-active' : ''}`}
                aria-label={s.title}
                aria-current={i === index ? 'step' : undefined}
                onClick={() => setIndex(i)}
              />
            </li>
          ))}
        </ol>

        <div className="checkin-story__actions">
          {scene.canDismissKiosk && (
            <button
              type="button"
              className="checkin-story__btn"
              onClick={() => setKioskDismissed((v) => !v)}
            >
              {kioskDismissed ? '키오스크 다시 보기' : '키오스크 닫기'}
            </button>
          )}
          <button
            type="button"
            className="checkin-story__btn checkin-story__btn--primary"
            disabled={index === CHECK_IN_STORY_SCENES.length - 1}
            onClick={() => setIndex((i) => i + 1)}
          >
            다음
          </button>
        </div>
      </nav>
    </div>
  );
}
