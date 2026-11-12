import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import IPhoneFrame, { PHONE_HEIGHT, PHONE_WIDTH } from './IPhoneFrame.jsx';
import { STORY_SCENES, storySceneUrl } from '../data/storyScenes.js';
import './StoryPopup.css';

const POPUP_PADDING = 32;
/** Header (title + 2-line caption) + nav under the phone. */
const CHROME_HEIGHT = 168;

function usePopupScale() {
  const compute = () =>
    Math.min(
      0.72,
      (window.innerHeight - POPUP_PADDING * 2 - CHROME_HEIGHT) / PHONE_HEIGHT,
      (window.innerWidth - POPUP_PADDING * 2 - 48) / PHONE_WIDTH,
    );
  const [scale, setScale] = useState(compute);
  useEffect(() => {
    const onResize = () => setScale(compute());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return Math.max(scale, 0.35);
}

/**
 * Separate presentation phone: open/close without adding DemoShell toggles.
 * Each scene reloads a seeded iframe so cross-visit UX can jump in one click.
 */
export default function StoryPopup({ open, onClose }) {
  const titleId = useId();
  const scale = usePopupScale();
  const [index, setIndex] = useState(0);
  const scene = STORY_SCENES[index];
  const src = storySceneUrl(scene);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(STORY_SCENES.length - 1, i + 1));
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  /** Portal so fixed positioning isn’t trapped by the main demo phone’s `transform: scale()`. */
  return createPortal(
    <div className="story-popup" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button type="button" className="story-popup__backdrop" aria-label="스토리 닫기" onClick={onClose} />
      <div className="story-popup__panel">
        <header className="story-popup__header">
          <div>
            <p className="story-popup__kicker">
              스토리 {index + 1} / {STORY_SCENES.length}
            </p>
            <h2 id={titleId} className="story-popup__title">
              {scene.title}
            </h2>
            <p className="story-popup__caption">
              {scene.caption.map((line) => (
                <span key={line} className="story-popup__caption-line">
                  {line}
                </span>
              ))}
            </p>
          </div>
          <button type="button" className="story-popup__close" onClick={onClose}>
            닫기
          </button>
        </header>

        <div
          className="story-popup__device"
          style={{ width: PHONE_WIDTH * scale, height: PHONE_HEIGHT * scale }}
        >
          <IPhoneFrame enabled scale={scale}>
            <iframe
              key={scene.id}
              className="story-popup__frame"
              title={scene.title}
              src={src}
            />
          </IPhoneFrame>
        </div>

        <nav className="story-popup__nav" aria-label="스토리 장면">
          <button
            type="button"
            className="story-popup__btn"
            disabled={index === 0}
            onClick={() => setIndex((i) => i - 1)}
          >
            이전
          </button>
          <ol className="story-popup__dots">
            {STORY_SCENES.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  className={`story-popup__dot ${i === index ? 'is-active' : ''}`}
                  aria-label={s.title}
                  aria-current={i === index ? 'step' : undefined}
                  onClick={() => setIndex(i)}
                />
              </li>
            ))}
          </ol>
          <button
            type="button"
            className="story-popup__btn story-popup__btn--primary"
            disabled={index === STORY_SCENES.length - 1}
            onClick={() => setIndex((i) => i + 1)}
          >
            다음
          </button>
        </nav>
      </div>
    </div>,
    document.body,
  );
}
