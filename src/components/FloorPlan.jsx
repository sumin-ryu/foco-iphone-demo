import { AREAS, FLOOR, OCCUPIED_SEATS, SEATS, SEAT_ZONES, seatLabel } from '../data/seats.js';
import './FloorPlan.css';

const at = (x, y, w, h) => ({
  left: `calc(var(--u) * ${x})`,
  top: `calc(var(--u) * ${y})`,
  ...(w !== undefined && { width: `calc(var(--u) * ${w})`, height: `calc(var(--u) * ${h})` }),
});

/**
 * Seat map of the cafe. `unit` is the px size of one desk; `variant` picks the app or kiosk look.
 * With `onRoomSelect`, study rooms become buttons.
 */
export default function FloorPlan({ unit, selected, onSelect, onRoomSelect, variant = 'app' }) {
  return (
    <div
      className={`floor-plan floor-plan--${variant}`}
      style={{ '--u': `${unit}px`, width: unit * FLOOR.width, height: unit * FLOOR.height }}
    >
      {AREAS.map((a) => {
        const Tag = a.room && onRoomSelect ? 'button' : 'div';
        return (
          <Tag
            key={`${a.kind}-${a.x}-${a.y}`}
            {...(Tag === 'button' && { type: 'button', onClick: () => onRoomSelect(a.room) })}
            className={`floor-plan__area floor-plan__area--${a.kind} ${Tag === 'button' ? 'is-link' : ''}`}
            style={at(a.x, a.y, a.w, a.h)}
          >
            {a.label && <span className="floor-plan__area-label">{a.label}</span>}
            {a.sub && <span className="floor-plan__area-sub">{a.sub}</span>}
            {Tag === 'button' && <span className="floor-plan__area-link">예약하기</span>}
          </Tag>
        );
      })}

      {SEAT_ZONES.map(({ id, marker: [x, y] }) => (
        <span key={id} className="floor-plan__zone" style={at(x, y)} aria-hidden>
          {id}
        </span>
      ))}

      {SEATS.map(({ id, x, y, chair }) => {
        const occupied = OCCUPIED_SEATS.has(id);
        const active = selected === id;
        return (
          <div
            key={id}
            className={`floor-plan__slot floor-plan__slot--chair-${chair} ${active ? 'is-selected' : ''}`}
            style={at(x, y, 1, 1)}
          >
            <span className="floor-plan__chair" />
            <button
              type="button"
              disabled={occupied}
              className={`floor-plan__seat ${occupied ? 'is-occupied' : ''} ${active ? 'is-selected' : ''}`}
              aria-label={`${seatLabel(id)} ${occupied ? '사용 중' : '이용 가능'}`}
              aria-pressed={active}
              onClick={() => onSelect?.(id)}
            >
              {active && id}
            </button>
          </div>
        );
      })}
    </div>
  );
}
