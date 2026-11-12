import { FOCUS_TYPES } from '../data/focusTypes.js';
import { LONG_BLOCK } from '../data/pattern.js';
import { SLOTS } from '../data/records.js';
import './TypeScatter.css';

/** Focus stretch range (minutes) across the plot; `LONG_BLOCK` sits in the middle. */
const X_MIN = LONG_BLOCK - 40;
const X_MAX = LONG_BLOCK + 40;
/** Height (% from the bottom) for one, two and three or more subjects. */
const ROWS = [22, 64, 84];
/** Quadrants in reading order: multi on top, short on the left. */
const QUADRANTS = ['relay', 'triathlon', 'sprint', 'marathon'].map((id) =>
  FOCUS_TYPES.find((t) => t.id === id),
);

/** A small stable offset so visits with the same subject count don't sit on one line. */
const jitter = (key) => {
  let hash = 0;
  for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) % 997;
  return (hash / 997 - 0.5) * 14;
};

const leftOf = (block) =>
  `${((Math.min(X_MAX, Math.max(X_MIN, block)) - X_MIN) / (X_MAX - X_MIN)) * 100}%`;

/**
 * One dot per visit: across, how long a focus stretch ran; up, how many subjects it covered.
 * Dots are colored by check-in time, and the quadrants that make up the month's type are lit.
 */
export default function TypeScatter({ points, highlight = [] }) {
  return (
    <figure className="type-scatter">
      <div className="type-scatter__body">
        <div className="type-scatter__rows" aria-hidden>
          <span>
            여러
            <br />
            과목
          </span>
          <span>
            한<br />
            과목
          </span>
        </div>
        <div className="type-scatter__plot">
          {QUADRANTS.map((type) => (
            <div
              key={type.id}
              className={`type-scatter__quad type-scatter__quad--${type.id} ${
                highlight.includes(type) ? 'is-on' : ''
              }`}
            >
              {type.name}
            </div>
          ))}
          {points.map((p, i) => (
            <i
              key={p.key}
              className={`type-scatter__dot is-${p.slot}`}
              style={{
                left: leftOf(p.block),
                bottom: `${ROWS[Math.min(p.subjects, 3) - 1] + jitter(p.key)}%`,
                animationDelay: `${200 + i * 30}ms`,
              }}
              role="img"
              aria-label={`${p.key} 한 번에 ${p.block}분, ${p.subjects}과목`}
            />
          ))}
        </div>
      </div>
      <div className="type-scatter__cols" aria-hidden>
        <span>짧게 끊어서</span>
        <span>{LONG_BLOCK}분</span>
        <span>길게 이어서</span>
      </div>
      <figcaption className="type-scatter__legend">
        {SLOTS.map((slot) => (
          <span key={slot.id}>
            <i className={`type-scatter__dot is-${slot.id}`} />
            {slot.label}
            <em>{points.filter((p) => p.slot === slot.id).length}</em>
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
