import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import FocusMark from '../components/FocusMark.jsx';
import KioskScene from '../components/KioskScene.jsx';
import { CloseIcon, FlashlightIcon } from '../components/icons.jsx';
import {
  clearPublishedCheckIn,
  subscribeCheckIn,
} from '../data/checkInBridge.js';
import { seatLabel } from '../data/seats.js';
import { DEMO_CHECK_IN, useAppStore } from '../store/AppStore.jsx';
import { useScanSteps } from '../hooks/useScanSteps.js';
import { useStatusBarTheme } from '../hooks/useStatusBarTheme.js';
import './CheckIn.css';

/** Phone-only demo: if no kiosk tab finishes check-in, use demo seat/pass after this wait. */
const DEMO_FALLBACK_MS = 8000;

export default function CheckIn() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const hold = params.get('hold'); // `scan` | `linking` — freeze that step for review
  const holdScan = hold === 'scan';
  const holdLinking = hold === 'linking';
  const { session, linking, focus, linkSession, connectSession, cancelLink } = useAppStore();
  const initialStep = holdScan
    ? 'scanning'
    : holdLinking
      ? 'linking'
      : session
        ? 'connected'
        : linking
          ? 'linking'
          : 'scanning';
  const [scanStep, detect] = useScanSteps(initialStep, linkSession, 'linking', {
    autoDetect: !holdScan && !holdLinking,
  });
  const step = holdScan
    ? 'scanning'
    : holdLinking
      ? 'linking'
      : session
        ? 'connected'
        : scanStep === 'scanning' || scanStep === 'detected'
          ? scanStep
          : 'linking';
  const [torch, setTorch] = useState(false);
  useStatusBarTheme('light');

  // Wait for the kiosk to finish pass + seat (or fall back for phone-only demo).
  useEffect(() => {
    if (holdLinking || !linking || session) return undefined;

    const unsub = subscribeCheckIn((payload) => {
      clearPublishedCheckIn();
      connectSession(payload);
    });

    const fallback = setTimeout(() => {
      clearPublishedCheckIn();
      connectSession(DEMO_CHECK_IN);
    }, DEMO_FALLBACK_MS);

    return () => {
      unsub();
      clearTimeout(fallback);
    };
  }, [linking, session, connectSession]);

  const leave = () => {
    if (linking && !session) cancelLink();
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate('/', { replace: true });
  };

  const beginFocus = () => navigate('/focus/plan');

  if (focus) return <Navigate to="/focus" replace />;

  return (
    <div className={`checkin checkin--${step} ${torch ? 'is-torch' : ''}`}>
      <KioskScene className="checkin__scene" scanned={step !== 'scanning'} />

      <header className="checkin__header">
        <button type="button" className="checkin__icon-btn" onClick={leave} aria-label="닫기">
          <CloseIcon size={26} />
        </button>
        <h1 className="checkin__title">체크인 연결하기</h1>
        <button
          type="button"
          className="checkin__icon-btn"
          onClick={() => setTorch((v) => !v)}
          aria-pressed={torch}
          aria-label="손전등"
        >
          <FlashlightIcon on={torch} />
        </button>
      </header>

      <p className="checkin__guide">키오스크에 표시된 QR을 스캔해주세요.</p>

      <div
        className="checkin__frame"
        onClick={detect}
        role={step === 'scanning' ? 'button' : undefined}
        aria-label={step === 'scanning' ? 'QR 스캔하기' : undefined}
      >
        <span className="checkin__scanline" />
        {step === 'linking' && (
          <div className="checkin__card checkin__card--linking">
            <p className="checkin__card-title">CHECK-IN</p>
            <p className="checkin__card-sub">연결 중입니다…</p>
            <div className="checkin__linking-mid">
              <span className="checkin__spinner" aria-hidden />
            </div>
            <p className="checkin__card-hint">
              키오스크에서 이용권과
              <br />
              좌석을 선택해 주세요.
            </p>
          </div>
        )}
        {step === 'connected' && session && (
          <div className="checkin__card">
            <p className="checkin__card-title">CHECK-IN</p>
            <p className="checkin__card-sub">연결되었습니다.</p>
            <FocusMark
              level={session.passLevel}
              size={70}
              strokeWidth={2.5}
              animate
              className="checkin__card-mark"
            />
            <p className="checkin__card-seat">{seatLabel(session.seat)}</p>
            <p className="checkin__card-time">
              {session.passHours}H / {session.startLabel} — {session.endLabel}
            </p>
          </div>
        )}
      </div>

      {step === 'connected' && (
        <div className="checkin__actions">
          <button type="button" className="checkin__primary" onClick={beginFocus}>
            집중 기록 시작하기
          </button>
          <button type="button" className="checkin__later" onClick={leave}>
            나중에 하기
          </button>
        </div>
      )}
    </div>
  );
}
