import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  REST_KEY,
  REVIEW_KEY,
  buildFocusResult,
  summarizeFocus,
} from '../components/focusSummary.js';
import { ChevronDownIcon, PencilIcon } from '../components/icons.jsx';
import { clockNow, useNow } from '../hooks/useNow.js';
import { useStatusBarTheme } from '../hooks/useStatusBarTheme.js';
import { getPlanName, useAppStore } from '../store/AppStore.jsx';
import './Focus.css';

const CONFIRM_TIMEOUT = 3000;
const UNDO_TIMEOUT = 4000;
const HOUR = 60 * 60 * 1000;
/** The hour bar is split into 12-minute ticks. */
const TICKS = 5;
const REST_COLOR = '#6e6e6e';
/** Warn this long before the pass runs out. */
const PASS_WARNING = 10 * 60 * 1000;

const pad = (n) => String(n).padStart(2, '0');
const formatMinSec = (ms) => {
  const total = Math.floor(ms / 1000);
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
};

function CheckMark() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="12" height="17" viewBox="0 0 12 17" aria-hidden>
      <path d="M1.5 0v17M10.5 0v17" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="13" height="15" viewBox="0 0 13 15" aria-hidden>
      <path d="M0 0l12.8 7.35L0 14.7z" fill="currentColor" />
    </svg>
  );
}

/** What was left last time, shown while going over it. */
function ReviewNotes({ review }) {
  return (
    <ul className="focus__review-notes">
      {review.lines.map((line) => (
        <li key={line.key}>
          <b>{line.name}</b>
          {line.text}
        </li>
      ))}
    </ul>
  );
}

export default function Focus() {
  const navigate = useNavigate();
  const {
    session,
    focus,
    toggleRest,
    endFocus,
    plans,
    switchFocusItem,
    restoreFocusItems,
    toggleFocusDone,
    setFocusNote,
  } = useAppStore();
  const now = useNow(1000);
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  /** The last switch, while it can still be undone. */
  const [undo, setUndo] = useState(null);
  const [noteOpen, setNoteOpen] = useState(false);
  /** Set once the session is handed off to the completion page, so the guard below stays quiet. */
  const endingRef = useRef(false);
  /** Ends the session; kept current every render so the expiry effect can call it. */
  const endRef = useRef(null);
  const passMs = (session?.passHours ?? 0) * HOUR;
  const expired = Boolean(session && focus) && now - focus.startedAt >= passMs;
  useStatusBarTheme('light');

  useEffect(() => {
    if (expired) endRef.current?.(true);
  }, [expired]);

  useEffect(() => {
    if (!confirmingEnd) return undefined;
    const id = setTimeout(() => setConfirmingEnd(false), CONFIRM_TIMEOUT);
    return () => clearTimeout(id);
  }, [confirmingEnd]);

  useEffect(() => {
    if (!undo) return undefined;
    const id = setTimeout(() => setUndo(null), UNDO_TIMEOUT);
    return () => clearTimeout(id);
  }, [undo]);

  if (!session || !focus) return endingRef.current ? null : <Navigate to="/" replace />;

  const resting = Boolean(focus.restStartedAt);
  const plan = plans.find((p) => p.id === focus.planId) ?? focus.quickPlan;
  const { elapsedMs, items, currentKey, timeline, totals, restMs } = summarizeFocus(focus, plan, now);
  const remainingMs = Math.max(0, passMs - Math.min(passMs, elapsedMs));
  const note = focus.note ?? '';
  const itemByKey = new Map(items.map((item) => [item.key, item]));
  const reviewItem = itemByKey.get(REVIEW_KEY);
  const reviewing = Boolean(reviewItem) && currentKey === REVIEW_KEY;
  const colorOf = (key) => (key === REST_KEY ? REST_COLOR : itemByKey.get(key)?.color);

  const hourIndex = Math.min(Math.floor(elapsedMs / HOUR), Math.max(0, session.passHours - 1));
  const hourStart = hourIndex * HOUR;
  const barSegments = timeline
    .map((span) => ({
      ...span,
      start: Math.max(span.from, hourStart) - hourStart,
      end: Math.min(span.to, hourStart + HOUR) - hourStart,
    }))
    .filter((s) => s.end > s.start);
  const legendKeys = [
    ...new Set([...barSegments.map((s) => s.key).filter((k) => k !== REST_KEY), currentKey]),
  ];

  const switchTo = (item) => {
    if (item.key === currentKey) return;
    setUndo({
      key: item.key,
      label: item.label,
      segments: focus.segments,
      wasDone: focus.doneKeys.includes(item.key),
    });
    switchFocusItem({ key: item.key, at: clockNow() - focus.startedAt, firstKey: items[0].key });
  };

  const undoSwitch = () => {
    restoreFocusItems({
      segments: undo.segments,
      doneKeys: undo.wasDone ? [...focus.doneKeys, undo.key] : focus.doneKeys,
    });
    setUndo(null);
  };

  /** `aside` shows in place of the time/status when the item hasn't been worked on yet. */
  const renderPlanItem = (item, label, aside) => {
    const done = focus.doneKeys.includes(item.key);
    const isCurrent = item.key === currentKey;
    const spent = totals.get(item.key) ?? 0;
    return (
      <div className={`focus__plan-item ${done ? 'is-done' : ''} ${isCurrent ? 'is-current' : ''}`}>
        <button
          type="button"
          className="focus__plan-check"
          onClick={() => toggleFocusDone(item.key)}
          aria-pressed={done}
          aria-label={`${label} 완료`}
        >
          <span className="focus__plan-box">{done && <CheckMark />}</span>
        </button>
        <button
          type="button"
          className="focus__plan-main"
          onClick={() => switchTo(item)}
          aria-current={isCurrent || undefined}
          aria-label={isCurrent ? `${label} 진행 중` : `${label} 항목으로 전환`}
        >
          <span className="focus__legend-swatch" style={{ background: item.color }} />
          <span className="focus__plan-text">{label}</span>
          <span className="focus__plan-status">
            {isCurrent ? '진행 중' : spent > 0 ? formatMinSec(spent) : aside}
          </span>
        </button>
      </div>
    );
  };

  /** `auto` when the pass ran out rather than the user ending it. */
  const endSession = (auto) => {
    if (endingRef.current) return;
    endingRef.current = true;
    navigate('/focus/done', { replace: true });
    endFocus(
      buildFocusResult({
        focus,
        plan,
        passHours: session.passHours,
        now,
        autoEnded: auto,
      }),
    );
  };
  endRef.current = endSession;

  const finish = () => {
    if (!confirmingEnd) {
      setConfirmingEnd(true);
      return;
    }
    endSession(false);
  };

  const statusOf = (key) => {
    if (key === currentKey) return '진행 중';
    return focus.doneKeys.includes(key) ? '진행 완료' : '';
  };

  return (
    <div className={`focus ${resting ? 'is-resting' : ''}`}>
      <header className="focus__header">
        <button
          type="button"
          className="focus__icon-btn"
          onClick={() => navigate('/')}
          aria-label="홈으로"
        >
          <ChevronDownIcon />
        </button>
        <h1 className="focus__title">FOCUS</h1>
        <button
          type="button"
          className={`focus__icon-btn ${note.trim() ? 'has-note' : ''}`}
          onClick={() => setNoteOpen(true)}
          aria-label="메모"
        >
          <PencilIcon />
        </button>
      </header>

      <div className="focus__scroll">
        {remainingMs <= PASS_WARNING && (
          <p className="focus__pass-warning" role="status">
            {remainingMs < 60_000
              ? '곧 이용권 시간이 끝나요'
              : `이용권 시간이 ${Math.ceil(remainingMs / 60_000)}분 남았어요`}
          </p>
        )}
        <p className="focus__bar-label">{hourIndex + 1}H BAR</p>
        <p
          className="focus__timer"
          aria-label={`${hourIndex + 1}시간째 바 ${formatMinSec(elapsedMs - hourStart)}`}
        >
          {formatMinSec(elapsedMs - hourStart)}
        </p>

        <div className="focus__bar" role="img" aria-label="이번 1시간 바 진행 상황">
          <span className="focus__ray focus__ray--up" aria-hidden />
          <span className="focus__ray focus__ray--down" aria-hidden />
          {barSegments.map((s) => (
            <span
              key={`${s.key}-${s.from}`}
              className={`focus__bar-fill ${s.to === elapsedMs ? 'is-active' : ''} ${
                s.key === REST_KEY ? 'is-rest' : ''
              }`}
              style={{
                left: `${(s.start / HOUR) * 100}%`,
                width: `${((s.end - s.start) / HOUR) * 100}%`,
                '--item-color': colorOf(s.key),
              }}
            />
          ))}
          {Array.from({ length: TICKS + 1 }, (_, i) => (
            <span key={i} className="focus__bar-tick" style={{ left: `${(i / TICKS) * 100}%` }} />
          ))}
        </div>

        <div className="focus__controls">
          <button
            type="button"
            className={`focus__control ${resting ? 'focus__control--resume' : 'focus__control--rest'}`}
            onClick={toggleRest}
          >
            {resting ? <PlayIcon /> : <PauseIcon />}
            {resting ? '재개하기' : '휴식하기'}
          </button>
        </div>

        {plan ? (
          <section className="focus__plan-card">
            <p className="focus__plan-card-title">
              오늘의 PLAN
              <span>{plan.memo || getPlanName(plan)}</span>
            </p>
            <ul>
              {reviewItem && (
                <li className="focus__plan-group">
                  {renderPlanItem(reviewItem, reviewItem.label, '10분')}
                  {reviewing && <ReviewNotes review={focus.review} />}
                </li>
              )}
              {plan.subjects.map((s) => {
                const subjectItems = items.filter((item) => item.subjectId === s.id);
                if (subjectItems.length === 1 && !subjectItems[0].subject) {
                  return (
                    <li key={s.id} className="focus__plan-group">
                      {renderPlanItem(subjectItems[0], s.name, s.goal)}
                    </li>
                  );
                }
                const subjectDone = subjectItems.filter((item) =>
                  focus.doneKeys.includes(item.key),
                ).length;
                return (
                  <li key={s.id} className="focus__plan-group">
                    <p className="focus__plan-subject">
                      {s.name}
                      <span className="focus__plan-count">
                        {subjectDone}/{subjectItems.length}
                      </span>
                      {s.goal && <span className="focus__plan-big">{s.goal}</span>}
                    </p>
                    <ul>
                      {subjectItems.map((item) => (
                        <li key={item.key}>{renderPlanItem(item, item.label)}</li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ul>
            {restMs > 0 && (
              <p className={`focus__plan-rest ${resting ? 'is-current' : ''}`}>
                <span className="focus__legend-swatch" style={{ background: REST_COLOR }} />
                휴식
                <span className="focus__plan-status">
                  {resting ? '휴식 중' : formatMinSec(restMs)}
                </span>
              </p>
            )}
          </section>
        ) : (
          <ul className="focus__legend">
            {legendKeys.map((key) => {
              const item = itemByKey.get(key);
              if (!item) return null;
              const isCurrent = key === currentKey;
              return (
                <li
                  key={key}
                  className={`focus__legend-row ${isCurrent ? 'is-current' : ''} ${
                    focus.doneKeys.includes(key) && !isCurrent ? 'is-done' : ''
                  }`}
                >
                  <span className="focus__legend-swatch" style={{ background: item.color }} />
                  <span className="focus__legend-label">
                    {item.label} {statusOf(key)}
                  </span>
                  {!isCurrent && (
                    <span className="focus__legend-time">
                      {formatMinSec(totals.get(key) ?? 0)}
                    </span>
                  )}
                </li>
              );
            })}
            {restMs > 0 && (
              <li className={`focus__legend-row ${resting ? 'is-resting-now' : 'is-done'}`}>
                <span className="focus__legend-swatch" style={{ background: REST_COLOR }} />
                <span className="focus__legend-label">휴식 {resting ? '중' : ''}</span>
                {!resting && <span className="focus__legend-time">{formatMinSec(restMs)}</span>}
              </li>
            )}
            {reviewing && (
              <li className="focus__legend-notes">
                <ReviewNotes review={focus.review} />
                <button
                  type="button"
                  className="focus__review-done"
                  onClick={() => {
                    switchTo(items[1]);
                    toggleFocusDone(REVIEW_KEY);
                  }}
                >
                  복습 마치기
                </button>
              </li>
            )}
          </ul>
        )}

        {note.trim() && (
          <button type="button" className="focus__note-card" onClick={() => setNoteOpen(true)}>
            <span className="focus__note-label">메모</span>
            <span className="focus__note-text">{note}</span>
          </button>
        )}
      </div>

      <button
        type="button"
        className={`focus__end ${confirmingEnd ? 'is-confirming' : ''}`}
        onClick={finish}
      >
        {confirmingEnd ? '한 번 더 누르면 종료돼요' : '집중 종료하기'}
      </button>

      {noteOpen && (
        <div className="focus__sheet-backdrop" onClick={() => setNoteOpen(false)}>
          <div
            className="focus__sheet"
            role="dialog"
            aria-label="집중 메모"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="focus__sheet-head">
              <p>메모</p>
              <button type="button" onClick={() => setNoteOpen(false)}>
                완료
              </button>
            </div>
            <textarea
              className="focus__sheet-input"
              value={note}
              onChange={(e) => setFocusNote(e.target.value)}
              placeholder="떠오른 생각, 질문할 것, 다음에 할 일을 적어두세요."
              maxLength={300}
              autoFocus
            />
            <p className="focus__sheet-hint">집중을 마치면 오늘 기록에 같이 남아요.</p>
          </div>
        </div>
      )}

      <div className={`focus__toast ${undo ? 'is-visible' : ''}`} role="status">
        {undo && (
          <>
            <span className="focus__toast-text">‘{undo.label}’ 항목으로 전환했어요</span>
            <button type="button" className="focus__toast-undo" onClick={undoSwitch}>
              되돌리기
            </button>
          </>
        )}
      </div>
    </div>
  );
}
