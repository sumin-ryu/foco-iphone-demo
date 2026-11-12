import { HOUR, formatDuration, formatMinSec, sliceHours, toClock } from './reportFormat.js';
import useHourFlip from './useHourFlip.js';
import './HourWheel.css';

const TICKS = 5;
const REST_COLOR = '#6e6e6e';
/** Angle between neighboring bars, matching the focus screen's rays. */
const STEP_DEG = 45;

/**
 * Every hour bar of the pass fans out from one pivot behind the text, like the focus screen's
 * bar and rays: the current hour lies flat, its neighbors are the blurred rays above and below.
 * Swiping or scrolling turns the fan to the previous / next bar; the text stays in place and only
 * its content follows the flat bar.
 */
export default function HourWheel({ result, itemByKey }) {
  const slices = sliceHours(result);
  const { hour, go, rootRef, handlers } = useHourFlip(slices.length);
  const usedMs = result.focusMs + result.restMs;
  const maxRows = Math.max(2, ...slices.map((s) => s.pieces.length + (s.unused ? 1 : 0)));
  const { start, pieces, unused } = slices[hour];
  const fanTurn = { transform: `rotate(${-hour * STEP_DEG}deg)` };

  return (
    <div ref={rootRef} className="hour-wheel" style={{ '--rows': maxRows }} {...handlers}>
      <div className="hour-wheel__backdrop" aria-hidden>
        <div className="hour-wheel__fan" style={fanTurn}>
          {slices.map((s, h) => {
            const distance = Math.abs(h - hour);
            const endsHere = usedMs > s.start && usedMs < s.start + HOUR;
            return (
              <div
                key={h}
                className={`hour-wheel__arm ${distance === 0 ? 'is-front' : ''} ${
                  distance > 1 ? 'is-hidden' : ''
                }`}
                style={{ transform: `rotate(${h * STEP_DEG}deg)` }}
              >
                <div className="hour-wheel__bar">
                  {s.pieces.map((p) => (
                    <span
                      key={`${p.key}-${p.from}`}
                      style={{
                        left: `${((p.start - s.start) / HOUR) * 100}%`,
                        width: `${((p.end - p.start) / HOUR) * 100}%`,
                        background: p.rest ? REST_COLOR : itemByKey.get(p.key)?.color,
                      }}
                    />
                  ))}
                  {Array.from({ length: TICKS - 1 }, (_, i) => (
                    <i key={i} style={{ left: `${((i + 1) / TICKS) * 100}%` }} />
                  ))}
                  {endsHere && (
                    <b
                      className="hour-wheel__tip"
                      style={{ left: `${((usedMs - s.start) / HOUR) * 100}%` }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Each bar's heading rides on the same fan, so it swings in and out with its bar. */}
      <div className="hour-wheel__fan hour-wheel__heads" style={fanTurn}>
        {slices.map((s, h) => (
          <div
            key={h}
            className={`hour-wheel__arm ${h === hour ? 'is-front' : 'is-hidden'}`}
            style={{ transform: `rotate(${h * STEP_DEG}deg)` }}
            aria-hidden={h !== hour || undefined}
          >
            <div className="hour-wheel__head">
              <p className="hour-wheel__label">{h + 1}H BAR</p>
              <p className={`hour-wheel__timer ${s.pieces.length ? '' : 'is-empty'}`}>
                {formatMinSec(s.focusMs)}
              </p>
              <p className="hour-wheel__caption">
                {s.pieces.length ? '집중' : '사용하지 않은 시간'} ·{' '}
                {toClock(result.startedAt + s.start)} —{' '}
                {toClock(result.startedAt + s.start + HOUR)}
                {s.restMs > 0 && ` · 휴식 ${formatDuration(s.restMs)}`}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="hour-wheel__text">

        <ul className="hour-wheel__legend">
          {pieces.map((p) => {
            const item = itemByKey.get(p.key);
            return (
              <li key={`${p.key}-${p.from}`} className="hour-wheel__row">
                <span
                  className="hour-wheel__swatch"
                  style={{ background: p.rest ? REST_COLOR : item?.color }}
                />
                <span className="hour-wheel__clock">{toClock(result.startedAt + p.start)}</span>
                <span className="hour-wheel__name">
                  {!p.rest && item?.subject && <em>{item.subject}</em>}
                  {p.rest ? '휴식' : (item?.label ?? '집중')}
                </span>
                <span className="hour-wheel__duration">{formatDuration(p.end - p.start)}</span>
              </li>
            );
          })}
          {unused > 0 && (
            <li className="hour-wheel__row is-unused">
              <span className="hour-wheel__swatch" />
              <span className="hour-wheel__clock">
                {toClock(result.startedAt + Math.max(start, usedMs))}
              </span>
              <span className="hour-wheel__name">사용하지 않은 시간</span>
              <span className="hour-wheel__duration">{formatDuration(unused)}</span>
            </li>
          )}
        </ul>
      </div>

      <div className="hour-wheel__dots" aria-label="시간 바 넘기기">
        {slices.map((_, h) => (
          <button
            key={h}
            type="button"
            className={`hour-wheel__dot ${h === hour ? 'is-active' : ''}`}
            onClick={() => go(h - hour)}
            aria-label={`${h + 1}시간째`}
            aria-current={h === hour || undefined}
          />
        ))}
      </div>
    </div>
  );
}
