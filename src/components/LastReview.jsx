import { moodLabel, reviewWhen } from '../data/review.js';
import { clockNow } from '../hooks/useNow.js';
import { useLastReview } from '../hooks/useLastReview.js';
import { useAppStore } from '../store/AppStore.jsx';
import './LastReview.css';

/** The last visit's notes, read before planning the next focus, with the review-first switch. */
export default function LastReview() {
  const { reviewFirst, setReviewFirst } = useAppStore();
  const { review } = useLastReview();
  if (!review) return null;
  const mood = moodLabel(review.mood);

  return (
    <section className="last-review" aria-label="지난번 복습">
      <p className="last-review__head">
        지난번 복습
        {mood && <span className="last-review__mood">{mood}</span>}
        <span className="last-review__when">{reviewWhen(review.startedAt, clockNow())}</span>
      </p>
      <ul className="last-review__lines">
        {review.lines.map((line) => (
          <li key={line.key}>
            <span className="last-review__name">{line.name}</span>
            <span className="last-review__text">{line.text}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        role="switch"
        aria-checked={reviewFirst}
        className={`last-review__toggle ${reviewFirst ? 'is-on' : ''}`}
        onClick={() => setReviewFirst(!reviewFirst)}
      >
        <span>
          복습 10분으로 시작하기
          <small>첫 항목에 ‘지난번 복습’이 들어가요</small>
        </span>
        <i className="last-review__switch" aria-hidden />
      </button>
    </section>
  );
}
