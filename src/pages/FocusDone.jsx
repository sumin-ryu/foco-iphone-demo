import { Navigate, useNavigate } from 'react-router-dom';
import FocusReport from '../components/FocusReport.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { groupBySubject } from '../components/focusSummary.js';
import { FEEDBACK_MOODS } from '../data/feedback.js';
import { toKey } from '../data/records.js';
import { todayDiscovery } from '../data/review.js';
import { useAppStore } from '../store/AppStore.jsx';
import './pages.css';

export default function FocusDone() {
  const navigate = useNavigate();
  const { lastResult: result, session, updateLastResult, updateReview } = useAppStore();
  if (!result) return <Navigate to="/" replace />;

  const goHome = () => navigate('/', { replace: true });
  const feedback = result.feedback ?? { mood: null, text: '' };
  const review = { notes: {}, mood: null, ...result.review };
  const noteGroups = groupBySubject(result).filter((g) => !g.review && g.subject.id != null);
  const setFeedback = (patch) => {
    updateLastResult({ feedback: { ...feedback, ...patch } });
    // Keep review mood in sync so LastReview can show how the last visit felt.
    if ('mood' in patch) updateReview({ mood: patch.mood });
  };
  const setNote = (key, text) => updateReview({ notes: { ...review.notes, [key]: text } });
  const goRecord = () =>
    navigate(`/record?date=${toKey(new Date(result.startedAt))}`, { replace: true });

  return (
    <>
      <PageHeader title="집중 완료" onBack={goHome} />
      <div className="page report-page">
        {result.autoEnded && (
          <p className="focus-done__notice" role="status">
            {result.passHours}H PASS 시간이 끝나서 집중을 자동으로 마쳤어요.
          </p>
        )}

        <section className="card focus-done__discovery">
          <p className="card__label">오늘의 발견</p>
          <p className="focus-done__discovery-text">{todayDiscovery(result)}</p>
        </section>

        <FocusReport result={result} hideFeedback hideReview />

        {noteGroups.length > 0 && (
          <>
            <h2 className="section-title focus-done__review-title">
              내일을 위한 복습
              <span className="focus-done__count">선택</span>
            </h2>
            <section className="card focus-done__review-form">
              <div className="focus-done__review-row">
                <p className="focus-done__review-label">
                  다음에 다시 볼 것
                  <small>다음 집중을 시작할 때 먼저 복습할 수 있어요</small>
                </p>
                {noteGroups.map((g) => (
                  <label key={g.key} className="focus-done__note">
                    <span>{g.subject.name}</span>
                    <input
                      value={review.notes[g.key] ?? ''}
                      onChange={(e) => setNote(g.key, e.target.value)}
                      placeholder="틀린 문제, 헷갈린 개념"
                      maxLength={40}
                      enterKeyHint="done"
                    />
                  </label>
                ))}
              </div>
            </section>
          </>
        )}

        <h2 className="section-title focus-done__memo-title">
          오늘 집중은 어땠나요?
          <span className="focus-done__count">선택</span>
        </h2>
        <section className="card focus-done__feedback">
          <div className="focus-done__moods" role="radiogroup" aria-label="오늘 집중 평가">
            {FEEDBACK_MOODS.map((m) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={feedback.mood === m.id}
                className={`focus-done__mood ${feedback.mood === m.id ? 'is-selected' : ''}`}
                onClick={() => setFeedback({ mood: feedback.mood === m.id ? null : m.id })}
              >
                {m.label}
              </button>
            ))}
          </div>
          <textarea
            className="focus-done__feedback-input"
            value={feedback.text}
            onChange={(e) => setFeedback({ text: e.target.value })}
            placeholder="잘된 점, 다음에 바꿔볼 점을 적어보세요."
            maxLength={300}
            aria-label="셀프 피드백"
          />
          <p className="focus-done__feedback-hint">적은 내용은 오늘 기록에 바로 저장돼요.</p>
        </section>

        {session ? (
          <>
            <button
              type="button"
              className="btn btn--primary report-page__action"
              onClick={() => navigate('/check-out')}
            >
              퇴실하기
            </button>
            <button type="button" className="btn btn--secondary" onClick={goHome}>
              홈으로
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn btn--primary report-page__action" onClick={goHome}>
              홈으로
            </button>
            <button type="button" className="btn btn--secondary report-page__action" onClick={goRecord}>
              캘린더에서 보기
            </button>
          </>
        )}
      </div>
    </>
  );
}
