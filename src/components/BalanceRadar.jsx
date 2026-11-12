import './BalanceRadar.css';

const WIDTH = 280;
const HEIGHT = 196;
const R = 74;
const CX = WIDTH / 2;
const CY = 40 + R;
const LEVELS = [0.25, 0.5, 0.75, 1];

const pointAt = (i, n, r) => {
  const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
  return [CX + r * Math.cos(angle), CY + r * Math.sin(angle)];
};
const shape = (values) =>
  values.map((v, i) => pointAt(i, values.length, R * Math.max(0.03, v)).join(',')).join(' ');
const percent = (ratio) => `${Math.round(ratio * 100)}%`;

/**
 * The month's balance as a radar (`balance` is `[{ label, value }]`, values 0–1), with last
 * month's outline dashed behind it when there is one.
 */
export default function BalanceRadar({ balance, prev, labels }) {
  const n = balance.length;
  return (
    <figure className="balance-radar">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="집중 균형">
        {LEVELS.map((level) => (
          <polygon
            key={level}
            className="balance-radar__grid"
            points={shape(balance.map(() => level))}
          />
        ))}
        {balance.map((axis, i) => {
          const [x, y] = pointAt(i, n, R);
          return <line key={axis.id} className="balance-radar__grid" x1={CX} y1={CY} x2={x} y2={y} />;
        })}
        {prev && (
          <polygon className="balance-radar__prev" points={shape(prev.map((a) => a.value))} />
        )}
        <polygon className="balance-radar__now" points={shape(balance.map((a) => a.value))} />
        {balance.map((axis, i) => {
          const [x, y] = pointAt(i, n, R * Math.max(0.03, axis.value));
          return <circle key={axis.id} className="balance-radar__dot" cx={x} cy={y} r={3} />;
        })}
        {balance.map((axis, i) => {
          const [x, y] = pointAt(i, n, R + 18);
          const top = y < CY - R / 2;
          return (
            <text
              key={axis.id}
              className="balance-radar__label"
              x={x}
              y={top ? y - 16 : y + 4}
              textAnchor="middle"
            >
              <tspan x={x} dy="0">
                {axis.label}
              </tspan>
              <tspan x={x} dy="16" className="balance-radar__value">
                {percent(axis.value)}
              </tspan>
            </text>
          );
        })}
      </svg>
      <figcaption className="balance-radar__legend">
        <span>
          <i className="balance-radar__key balance-radar__key--now" />
          {labels[0]}
        </span>
        {prev && (
          <span>
            <i className="balance-radar__key balance-radar__key--prev" />
            {labels[1]}
          </span>
        )}
      </figcaption>
    </figure>
  );
}
