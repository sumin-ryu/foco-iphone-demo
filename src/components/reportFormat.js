export const HOUR = 60 * 60 * 1000;

const pad = (n) => String(n).padStart(2, '0');

export const toClock = (ms) => {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** "2H 14M", "48M", "35S" (seconds only under a minute, for short demo sessions). */
export const formatDuration = (ms) => {
  const totalMin = Math.floor(ms / 60000);
  if (ms <= 0) return '0M';
  if (!totalMin) return `${Math.floor(ms / 1000)}S`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (!h) return `${m}M`;
  return m ? `${h}H ${m}M` : `${h}H`;
};

/** "47:12", like the focus screen timer. */
export const formatMinSec = (ms) => {
  const total = Math.floor(ms / 1000);
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
};

/**
 * Splits a result into 1-hour bars: the timeline pieces clipped to each hour, the pass time
 * left unused in it, and its focus / rest totals.
 */
export const sliceHours = (result) => {
  const usedMs = result.focusMs + result.restMs;
  const passEnd = result.passHours * HOUR;
  const count = Math.max(1, Math.ceil(Math.max(passEnd, usedMs) / HOUR));
  return Array.from({ length: count }, (_, h) => {
    const start = h * HOUR;
    const end = start + HOUR;
    const pieces = result.timeline
      .map((p) => ({ ...p, start: Math.max(p.from, start), end: Math.min(p.to, end) }))
      .filter((p) => p.end > p.start);
    const unusedFrom = Math.max(start, usedMs);
    const unusedTo = Math.min(end, passEnd);
    const spanOf = (list) => list.reduce((sum, p) => sum + p.end - p.start, 0);
    return {
      start,
      pieces,
      unused: unusedTo > unusedFrom ? unusedTo - unusedFrom : 0,
      focusMs: spanOf(pieces.filter((p) => !p.rest)),
      restMs: spanOf(pieces.filter((p) => p.rest)),
    };
  });
};
