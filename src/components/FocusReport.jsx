import FocusMark from './FocusMark.jsx';
import HourWheel from './HourWheel.jsx';
import { groupBySubject } from './focusSummary.js';
import { HOUR, formatDuration } from './reportFormat.js';
import { moodLabel as feedbackMoodLabel } from '../data/feedback.js';
import { moodLabel as reviewMoodLabel, reviewOf } from '../data/review.js';
import { useDarkScreen } from '../hooks/useDarkScreen.js';
import { getPassLevel } from '../store/AppStore.jsx';
import '../pages/pages.css';
import '../pages/RecordDetail.css';
import './FocusReport.css';

/**
 * How a focus session was spent within the pass: totals, a fan of 1-hour bars, a
 * per-subject breakdown with detail goals, and the notes left during and after.
 * `result` comes from the focus screen or demo records. `hideFeedback` / `hideReview`
 * leave those blocks out where they are being written.
 */
export default function FocusReport({ result, hideFeedback = false, hideReview = false }) {
  const itemByKey = new Map(result.items.map((item) => [item.key, item]));
  const usedMs = result.focusMs + result.restMs;
  const leftMs = Math.max(0, result.passHours * HOUR - usedMs);
  const groups = groupBySubject(result);
  const detailItems = result.items.filter((item) => item.subject);
  const doneCount = detailItems.filter((item) => item.done).length;
  const note = result.note?.trim();
  const mood = hideFeedback ? null : feedbackMoodLabel(result.feedback?.mood);
  const feedbackText = hideFeedback ? '' : result.feedback?.text?.trim();
  const review = hideReview ? null : reviewOf(result);
  useDarkScreen();

  return (
    <>
      <div className="record-detail__hero">
        <FocusMark
          level={getPassLevel(result.passHours)}
          size={64}
          strokeWidth={2.4}
          animate
          passHours={result.passHours}
          focusMin={result.focusMs / 60_000}
          restMin={result.restMs / 60_000}
        />
        <div>
          <p className="card__label">총 집중 시간</p>
          <p className="card__big">{formatDuration(result.focusMs)}</p>
          <p className="list__sub">
            휴식 {formatDuration(result.restMs)} · 남은 시간 {formatDuration(leftMs)}
          </p>
        </div>
      </div>

      <h2 className="section-title focus-done__pass-title">
        이용권 사용
        <span className="focus-done__count">
          {result.passHours}시간 중 {formatDuration(usedMs)} 사용
        </span>
      </h2>
      <HourWheel result={result} itemByKey={itemByKey} />

      <h2 className="section-title focus-done__subjects-title">
        과목별 집중
        {detailItems.length > 0 && (
          <span className="focus-done__count">
            세부 목표 {doneCount}/{detailItems.length} 완료
          </span>
        )}
      </h2>
      <div className="focus-done__subjects">
        {groups.map((g) => (
          <section key={g.key} className="card focus-done__subject-card">
            <div className="focus-done__subject-head">
              <p className="focus-done__subject-name">
                {!g.hasDetails && (
                  <i className="focus-done__swatch" style={{ background: g.items[0]?.color }} />
                )}
                {g.subject.name}
                {result.focusMs > 0 && g.ms > 0 && (
                  <span className="focus-done__share">
                    {Math.round((g.ms / result.focusMs) * 100)}%
                  </span>
                )}
              </p>
              <strong className={`focus-done__subject-time ${g.ms ? '' : 'focus-done__none'}`}>
                {g.ms ? formatDuration(g.ms) : '-'}
              </strong>
            </div>
            {g.subject.goal && (
              <p className="focus-done__goal">
                <span className="focus-done__goal-label">큰 목표</span>
                {g.subject.goal}
              </p>
            )}

            {g.hasDetails ? (
              <>
                <div className="focus-done__mix">
                  {g.items
                    .filter((item) => item.ms > 0)
                    .map((item) => (
                      <span key={item.key} style={{ flexGrow: item.ms, background: item.color }} />
                    ))}
                </div>
                <ul className="list">
                  {g.items.map((item) => (
                    <li key={item.key} className="list__item focus-done__task">
                      <p className="focus-done__task-title">
                        <i className="focus-done__swatch" style={{ background: item.color }} />
                        <span>{item.label}</span>
                        {item.done && <span className="focus-done__done">완료</span>}
                      </p>
                      <strong className={item.ms ? '' : 'focus-done__none'}>
                        {item.ms ? formatDuration(item.ms) : '-'}
                      </strong>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="focus-done__empty">
                {g.review ? '지난번에 남긴 내용을 먼저 복습했어요.' : '세부 목표 없이 집중했어요.'}
              </p>
            )}
          </section>
        ))}
      </div>

      {(note || mood || feedbackText) && (
        <>
          <h2 className="section-title focus-done__memo-title">메모</h2>
          <section className="card focus-done__memo">
            {note && (
              <div className="focus-done__memo-row">
                <p className="focus-done__memo-label">집중 중 메모</p>
                <p className="focus-done__memo-text">{note}</p>
              </div>
            )}
            {(mood || feedbackText) && (
              <div className="focus-done__memo-row">
                <p className="focus-done__memo-label">
                  셀프 피드백
                  {mood && <span className="focus-done__done">{mood}</span>}
                </p>
                {feedbackText && <p className="focus-done__memo-text">{feedbackText}</p>}
              </div>
            )}
          </section>
        </>
      )}

      {review && (
        <>
          <h2 className="section-title focus-done__review-title">
            내일을 위한 복습
            {review.mood && (
              <span className="focus-done__count">{reviewMoodLabel(review.mood)}</span>
            )}
          </h2>
          {review.lines.length > 0 && (
            <section className="card focus-done__review">
              <p className="focus-done__review-label">다음에 다시 볼 것</p>
              {review.lines.map((line) => (
                <p key={line.key} className="focus-done__review-line">
                  <b>{line.name}</b>
                  <span>{line.text}</span>
                </p>
              ))}
            </section>
          )}
        </>
      )}
    </>
  );
}
