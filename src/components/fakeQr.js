export const QR_SIZE = 25;
const FINDER = 7;

const isFinderArea = (x, y) => {
  const far = QR_SIZE - FINDER - 1;
  return (x <= FINDER && y <= FINDER) || (x >= far && y <= FINDER) || (x <= FINDER && y >= far);
};

/** Deterministic QR-looking SVG path (one unit per module) for `seed`. */
export function buildQrPath(seed = 20261011) {
  let state = seed;
  const random = () => {
    state = (state * 16807) % 2147483647;
    return state / 2147483647;
  };

  let d = '';
  for (let y = 0; y < QR_SIZE; y += 1) {
    for (let x = 0; x < QR_SIZE; x += 1) {
      if (!isFinderArea(x, y) && random() > 0.52) d += `M${x} ${y}h1v1h-1z`;
    }
  }

  const far = QR_SIZE - FINDER;
  for (const [fx, fy] of [
    [0, 0],
    [far, 0],
    [0, far],
  ]) {
    d += `M${fx} ${fy}h7v7h-7zM${fx + 1} ${fy + 1}v5h5v-5zM${fx + 2} ${fy + 2}h3v3h-3z`;
  }
  return d;
}
