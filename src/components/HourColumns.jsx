import { FADE_MINUTES } from '../data/monthSummary.js';
import './HourColumns.css';

const toPercent = (minutes) => `${(minutes / 60) * 100}%`;

/**
 * One column per hour bar, stacking how its 60 minutes went on average: focus at the bottom,
 * then rest, then time left unused. A guide marks the "faded" line.
 */
export default function HourColumns({ curve, fadeIndex }) {
  return (
    <figure className="hour-columns">
      <div className="hour-columns__plot">
        <div className="hour-columns__axis" aria-hidden>
          <span style={{ bottom: '100%' }}>60M</span>
          <span style={{ bottom: toPercent(FADE_MINUTES) }}>{FADE_MINUTES}M</span>
          <span style={{ bottom: 0 }}>0</span>
        </div>
        <div className="hour-columns__chart">
          <i className="hour-columns__guide" style={{ bottom: toPercent(FADE_MINUTES) }} />
          {curve.map((c, i) => (
            <div
              key={c.hour}
              className={`hour-columns__col ${c.avg < FADE_MINUTES ? 'is-faded' : ''} ${
                i === fadeIndex ? 'is-first-fade' : ''
              }`}
              style={{ animationDelay: `${i * 50}ms` }}
              role="img"
              aria-label={`${c.hour + 1}시간째 평균 집중 ${c.avg}분, 휴식 ${c.rest}분, 사용 안 함 ${c.unused}분`}
            >
              <span className="hour-columns__value" style={{ bottom: toPercent(c.avg) }}>
                {c.avg}
              </span>
              <span className="hour-columns__stack">
                <b className="hour-columns__focus" style={{ height: toPercent(c.avg) }} />
                <b className="hour-columns__rest" style={{ height: toPercent(c.rest) }} />
                <b className="hour-columns__unused" style={{ height: toPercent(c.unused) }} />
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="hour-columns__labels" aria-hidden>
        {curve.map((c) => (
          <span key={c.hour}>
            {c.hour + 1}H<em>{c.count}회</em>
          </span>
        ))}
      </div>
      <figcaption className="hour-columns__legend">
        <span>
          <i className="hour-columns__focus" />
          집중
        </span>
        <span>
          <i className="hour-columns__rest" />
          휴식
        </span>
        <span>
          <i className="hour-columns__unused" />
          사용 안 함
        </span>
      </figcaption>
    </figure>
  );
}
