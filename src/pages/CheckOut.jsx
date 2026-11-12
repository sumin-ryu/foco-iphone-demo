import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import FocusMark from '../components/FocusMark.jsx';
import KioskScene from '../components/KioskScene.jsx';
import { buildFocusResult } from '../components/focusSummary.js';
import { CloseIcon, FlashlightIcon } from '../components/icons.jsx';
import { HOUR, formatDuration, toClock } from '../components/reportFormat.js';
import { seatLabel } from '../data/seats.js';
import { MEMBER_CHECK_OUT } from '../kiosk/components/KioskQrView.jsx';
import { clockNow } from '../hooks/useNow.js';
import { useScanSteps } from '../hooks/useScanSteps.js';
import { useStatusBarTheme } from '../hooks/useStatusBarTheme.js';
import { useAppStore } from '../store/AppStore.jsx';
import './CheckIn.css';
import './CheckOut.css';

export default function CheckOut() {
  const navigate = useNavigate();
  const { session, focus, plans, lastResult, checkOut } = useAppStore();
  /** Snapshot of the visit taken at check-out, since the session itself is gone by then. */
  const [visit, setVisit] = useState(null);
  const [torch, setTorch] = useState(false);
  useStatusBarTheme('light');

  const [step, detect] = useScanSteps('scanning', () => {
    if (!session) return;
    // A pass is the most time a visit can take, so the stay never runs past it.
    const end = Math.min(clockNow(), session.startedAt + session.passHours * HOUR);
    const plan = focus && (plans.find((p) => p.id === focus.planId) ?? focus.quickPlan);
    setVisit({
      ...session,
      usedMs: end - session.startedAt,
      endLabel: toClock(end),
      hasReport: Boolean(focus) || (lastResult?.startedAt ?? 0) >= session.startedAt,
    });
    checkOut(focus ? buildFocusResult({ focus, plan, passHours: session.passHours, now: end }) : null);
  });

  if (!session && !visit) return <Navigate to="/" replace />;

  const leave = () => {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate('/', { replace: true });
  };
  const goHome = () => navigate('/', { replace: true });

  return (
    <div className={`checkin checkin--${step} ${torch ? 'is-torch' : ''}`}>
      <KioskScene className="checkin__scene" scanned={step !== 'scanning'} screen={MEMBER_CHECK_OUT} />

      <header className="checkin__header">
        <button type="button" className="checkin__icon-btn" onClick={leave} aria-label="닫기">
          <CloseIcon size={26} />
        </button>
        <h1 className="checkin__title">퇴실하기</h1>
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

      <p className="checkin__guide">키오스크의 퇴실 QR을 스캔해주세요.</p>
      {focus && step === 'scanning' && (
        <p className="checkout__notice">진행 중인 집중 기록도 함께 종료돼요.</p>
      )}

      <div
        className="checkin__frame"
        onClick={detect}
        role={step === 'scanning' ? 'button' : undefined}
        aria-label={step === 'scanning' ? 'QR 스캔하기' : undefined}
      >
        <span className="checkin__scanline" />
        {step === 'connected' && visit && (
          <div className="checkin__card">
            <p className="checkin__card-title">CHECK-OUT</p>
            <p className="checkin__card-sub">{formatDuration(visit.usedMs)} 이용했어요.</p>
            <FocusMark
              level={visit.passLevel}
              size={70}
              strokeWidth={2.5}
              animate
              className="checkin__card-mark"
            />
            <p className="checkin__card-seat">{seatLabel(visit.seat)}</p>
            <p className="checkin__card-time">
              {visit.passHours}H / {visit.startLabel} — {visit.endLabel}
            </p>
          </div>
        )}
      </div>

      {step === 'connected' && visit && (
        <div className="checkin__actions">
          {visit.hasReport ? (
            <>
              <button
                type="button"
                className="checkin__primary"
                onClick={() => navigate('/focus/done', { replace: true })}
              >
                오늘의 집중 리포트 보기
              </button>
              <button type="button" className="checkin__later" onClick={goHome}>
                홈으로
              </button>
            </>
          ) : (
            <button type="button" className="checkin__primary" onClick={goHome}>
              홈으로
            </button>
          )}
        </div>
      )}
    </div>
  );
}
