import './FocusMark.css';

const C = 25;
const STROKES = {
  vertical: [
    [C, 2],
    [C, 48],
  ],
  horizontal: [
    [2, C],
    [48, C],
  ],
  diagonalDown: [
    [8.7, 8.7],
    [41.3, 41.3],
  ],
  diagonalUp: [
    [41.3, 8.7],
    [8.7, 41.3],
  ],
  shallowDown: [
    [5.08, 13.5],
    [44.92, 36.5],
  ],
  shallowUp: [
    [44.92, 13.5],
    [5.08, 36.5],
  ],
};

const LEVEL_STROKES = {
  0: [],
  1: ['vertical'],
  2: ['vertical', 'horizontal'],
  3: ['vertical', 'shallowDown', 'shallowUp'],
  4: ['vertical', 'horizontal', 'diagonalDown', 'diagonalUp'],
};

const raysOf = (level) =>
  level === 0.5 ? [STROKES.horizontal[1]] : LEVEL_STROKES[level].flatMap((name) => STROKES[name]);

/** A lone ray would sit right of center, so the 1H mark shifts left by half its length. */
const offsetOf = (level) => (level === 0.5 ? (C - STROKES.horizontal[1][0]) / 2 : 0);

const clamp01 = (n) => Math.min(1, Math.max(0, n));

/**
 * How a visit filled its pass, as shares of pass minutes.
 * Example: 1h rest on an 8H pass → restShare 0.125.
 */
export function passSpendShares(passHours, focusMin = 0, restMin = 0) {
  const passMin = Math.max(1, passHours * 60);
  const focusShare = clamp01(focusMin / passMin);
  const restShare = clamp01(Math.min(restMin, passMin * (1 - focusShare)) / passMin);
  return {
    focusShare,
    restShare,
    unusedShare: Math.max(0, 1 - focusShare - restShare),
  };
}

/**
 * Paint whole rays (not dash segments) so the ratio stays readable at calendar sizes.
 * Focus rays first, then rest, then unused — counts follow the pass shares as closely as possible.
 */
function rayKinds(rayCount, focusShare, restShare) {
  if (rayCount <= 0) return [];
  let focusN = Math.round(focusShare * rayCount);
  let restN = Math.round(restShare * rayCount);
  if (restShare > 0.04 && restN === 0) restN = 1;
  if (focusShare > 0.04 && focusN === 0) focusN = 1;
  if (focusN + restN > rayCount) {
    const scale = rayCount / (focusN + restN);
    focusN = Math.max(focusShare > 0 ? 1 : 0, Math.round(focusN * scale));
    restN = Math.max(0, rayCount - focusN);
    if (restShare > 0.04 && restN === 0 && focusN > 1) {
      focusN -= 1;
      restN = 1;
    }
  }
  const unusedN = Math.max(0, rayCount - focusN - restN);
  return [
    ...Array(focusN).fill('focus'),
    ...Array(restN).fill('rest'),
    ...Array(unusedN).fill('idle'),
  ];
}

/**
 * Fill 1H rays in order: focus, then rest, then unused.
 * Partial hours keep center→tip bands on that one ray only (not the same mix on every ray).
 */
function ratioBandsPerRay(rayCount, { focusShare, restShare, unusedShare }) {
  if (rayCount <= 0) return [];
  let focusLeft = focusShare * rayCount;
  let restLeft = restShare * rayCount;
  let unusedLeft = unusedShare * rayCount;

  return Array.from({ length: rayCount }, () => {
    const bands = [];
    let filled = 0;
    const take = (left, className, stroke) => {
      if (left <= 0.002 || filled >= 0.998) return 0;
      const share = Math.min(left, 1 - filled);
      bands.push({ share, className, stroke });
      filled += share;
      return share;
    };
    focusLeft -= take(focusLeft, undefined, 'currentColor');
    restLeft -= take(restLeft, 'focus-mark__rest', undefined);
    unusedLeft -= take(unusedLeft, 'focus-mark__idle', undefined);
    return bands;
  });
}

/**
 * Asterisk that gains strokes as pass time grows (level 0–4; 0.5 is the single rightward ray of 1H).
 * With spend props: `whole` paints whole rays; `ratio` paints true shares along successive 1H rays.
 */
export default function FocusMark({
  level,
  size = 24,
  strokeWidth = 1.3,
  animate = false,
  className = '',
  passHours = null,
  focusMin = 0,
  restMin = 0,
  /** `whole` = coarse ray counts; `ratio` = sequential 1H-bar shares. */
  spendMode = 'whole',
}) {
  const rays = raysOf(level);
  const unitStroke = (strokeWidth * 50) / size;
  const split =
    passHours != null && (focusMin > 0 || restMin > 0)
      ? passSpendShares(passHours, focusMin, restMin)
      : null;
  const useRatio = split && spendMode === 'ratio';
  const kinds = split && !useRatio ? rayKinds(rays.length, split.focusShare, split.restShare) : null;
  const perRayBands = useRatio ? ratioBandsPerRay(rays.length, split) : null;
  const canAnimate = animate && !split;

  return (
    <svg
      className={`focus-mark ${canAnimate ? 'focus-mark--animate' : ''} ${split ? 'focus-mark--spend' : ''} ${useRatio ? 'focus-mark--ratio' : ''} ${className}`}
      width={size}
      height={size}
      viewBox="0 0 50 50"
      fill="none"
      aria-hidden
    >
      <g transform={`translate(${offsetOf(level)} 0)`}>
        <g strokeWidth={unitStroke} strokeLinecap="butt">
          {rays.map(([x, y], i) => {
            const bands = perRayBands?.[i];
            if (bands) {
              let offset = 0;
              return (
                <g key={`${x}-${y}`}>
                  {bands.map((band) => {
                    const start = offset;
                    offset += band.share;
                    return (
                      <line
                        key={start}
                        className={band.className}
                        x1={C}
                        y1={C}
                        x2={x}
                        y2={y}
                        pathLength={1}
                        stroke={band.stroke}
                        strokeDasharray={`${band.share} ${1 - band.share}`}
                        strokeDashoffset={-start}
                      />
                    );
                  })}
                </g>
              );
            }

            const kind = kinds?.[i] ?? 'focus';
            const stroke =
              kind === 'rest' ? undefined : kind === 'idle' ? undefined : 'currentColor';
            const lineClass =
              kind === 'rest' ? 'focus-mark__rest' : kind === 'idle' ? 'focus-mark__idle' : undefined;
            return (
              <line
                key={`${x}-${y}`}
                className={lineClass}
                x1={C}
                y1={C}
                x2={x}
                y2={y}
                pathLength={1}
                stroke={stroke}
                style={{ '--i': Math.floor(i / 2) }}
              />
            );
          })}
        </g>
        {rays.length > 0 && (
          <circle className="focus-mark__dot" cx={C} cy={C} r={unitStroke * 1.15} fill="currentColor" />
        )}
      </g>
    </svg>
  );
}
