import { ALL_ROUND } from '../data/focusTypes.js';

/** Cells laid out like the type chart: several subjects on top, long stretches on the right. */
const CELLS = [
  { id: 'relay', x: 0, y: 0 },
  { id: 'triathlon', x: 1, y: 0 },
  { id: 'sprint', x: 0, y: 1 },
  { id: 'marathon', x: 1, y: 1 },
];

/** A 2×2 grid marking where `type` sits on the type chart; all-round lights every cell. */
export default function TypeGlyph({ type, size = 28 }) {
  const allRound = type.id === ALL_ROUND.id;
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden>
      {CELLS.map((cell) => {
        const on = allRound || cell.id === type.id;
        return (
          <rect
            key={cell.id}
            x={cell.x * 10.5 + 0.5}
            y={cell.y * 10.5 + 0.5}
            width={9}
            height={9}
            rx={2}
            fill={on ? 'currentColor' : 'none'}
            fillOpacity={allRound ? 0.55 : 1}
            stroke="currentColor"
            strokeOpacity={on ? 0 : 0.3}
          />
        );
      })}
    </svg>
  );
}
