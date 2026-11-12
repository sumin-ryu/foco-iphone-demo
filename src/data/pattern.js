import { ALL_ROUND, FOCUS_TYPES } from './focusTypes.js';
import { RECORDS, RECORD_KEYS, SLOTS, TODAY_KEY, parseKey } from './records.js';

/** A focus stretch at least this long (minutes) counts as "long". */
export const LONG_BLOCK = 50;
/** Visits needed before naming a type. */
export const MIN_TYPE_VISITS = 4;
/** Visits needed before comparing which days went well. */
export const MIN_COMPARE_VISITS = 8;
/** A type holding this share of visits is the month's type; below it the month is all-round. */
const MAIN_SHARE = 0.6;
/** Groups compared for "잘 됐던 날" need this many visits each and at least this gap. */
const MIN_GROUP = 3;
const MIN_GAP = 0.1;

const pad = (n) => String(n).padStart(2, '0');
const mean = (list) => (list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0);

export const monthRecords = (year, month) => {
  const prefix = `${year}-${pad(month + 1)}`;
  return Object.values(RECORDS)
    .filter((r) => r.key.startsWith(prefix))
    .sort((a, b) => a.key.localeCompare(b.key));
};

/** Minutes of each focus stretch between rests. */
function stretchesOf(report) {
  const stretches = [];
  let run = 0;
  for (const p of report.timeline) {
    if (!p.rest) run += p.to - p.from;
    else if (run) {
      stretches.push(run / 60_000);
      run = 0;
    }
  }
  if (run) stretches.push(run / 60_000);
  return stretches;
}

/**
 * How long one focus stretch typically ran, weighted by length so a short leftover stretch at
 * the end of a visit doesn't pull a long-focus visit under the line.
 */
const typicalStretch = (stretches) => {
  const total = stretches.reduce((a, b) => a + b, 0);
  return total ? stretches.reduce((sum, m) => sum + m * m, 0) / total : 0;
};

/** One visit as a point: how long it focused at a stretch, how many subjects, how it went. */
export function visitPoint(record) {
  const { report } = record;
  const block = Math.round(typicalStretch(stretchesOf(report)));
  const subjects = report.subjects.length;
  const long = block >= LONG_BLOCK;
  const multi = subjects >= 2;
  const items = report.items.filter((item) => item.subject);
  return {
    key: record.key,
    slot: record.slot,
    block,
    subjects,
    type: FOCUS_TYPES.find((t) => t.long === long && t.multi === multi),
    doneRate: items.length ? items.filter((item) => item.done).length / items.length : null,
  };
}

/** The type most visits in `points` fell into, with its count. */
function dominant(points) {
  const counts = FOCUS_TYPES.map((type) => ({
    type,
    count: points.filter((p) => p.type === type).length,
  }));
  return counts.sort((a, b) => b.count - a.count)[0];
}

/**
 * The month's type: the quadrant most visits fell into, or all-round when no quadrant holds
 * most of them — then broken down by check-in time.
 */
function monthType(points) {
  if (points.length < MIN_TYPE_VISITS) return null;
  const top = dominant(points);
  if (top.count / points.length >= MAIN_SHARE) {
    return { ...top.type, main: top.type, count: top.count, bySlot: [] };
  }
  const bySlot = SLOTS.map((slot) => {
    const list = points.filter((p) => p.slot === slot.id);
    const top = dominant(list);
    return top.count >= 2 && top.count / list.length >= 0.5
      ? { slot, ...top, total: list.length }
      : null;
  }).filter(Boolean);
  const types = new Set(bySlot.map((s) => s.type));
  const second = FOCUS_TYPES.filter((type) => type !== top.type)
    .map((type) => ({ type, count: points.filter((p) => p.type === type).length }))
    .sort((a, b) => b.count - a.count)[0];
  return {
    ...ALL_ROUND,
    main: top.type,
    count: top.count,
    bySlot: types.size >= 2 ? bySlot : [],
    pair: [top.type, second.type],
  };
}

/** Records for the month, from the first day the demo has records for. */
function countedDays(year, month) {
  const today = parseKey(TODAY_KEY);
  const first = parseKey(RECORD_KEYS[0]);
  const start =
    first.getFullYear() === year && first.getMonth() === month ? first.getDate() : 1;
  const end =
    today.getFullYear() === year && today.getMonth() === month
      ? today.getDate()
      : new Date(year, month + 1, 0).getDate();
  return { start, end };
}

/**
 * Balance of the month on three axes (0–1): how regularly the member came (weeks with two or
 * more visits), how much of the stay was focus, and how many detail goals got done.
 */
function balanceOf(year, month) {
  const records = monthRecords(year, month);
  if (!records.length) return null;
  const { start, end } = countedDays(year, month);
  const weeks = Math.max(1, Math.ceil((end - start + 1) / 7));
  const perWeek = new Map();
  for (const r of records) {
    const week = Math.floor((parseKey(r.key).getDate() - start) / 7);
    perWeek.set(week, (perWeek.get(week) ?? 0) + 1);
  }
  const steadyWeeks = [...perWeek.values()].filter((n) => n >= 2).length;
  const focus = records.reduce((sum, r) => sum + r.focus, 0);
  const stay = records.reduce((sum, r) => sum + r.focus + r.rest, 0);
  const items = records.flatMap((r) => r.report.items.filter((item) => item.subject));
  const done = items.filter((item) => item.done).length;
  return [
    {
      id: 'steady',
      label: '꾸준함',
      value: Math.min(1, steadyWeeks / weeks),
      detail: `주 2회 이상 온 주 ${steadyWeeks}/${weeks}`,
    },
    {
      id: 'net',
      label: '순 집중 비율',
      value: stay ? focus / stay : 0,
      detail: '머문 시간 중 집중한 시간',
    },
    {
      id: 'plan',
      label: '계획 달성',
      value: items.length ? done / items.length : 0,
      detail: `세부 목표 ${done}/${items.length} 완료`,
    },
  ];
}

/** Ways of studying compared for "잘 됐던 날", each split into groups of visits. */
const FACTORS = [
  [
    {
      label: `한 번에 ${LONG_BLOCK}분 넘게 이어서 집중한 날`,
      tip: `${LONG_BLOCK}분 넘게 이어서 집중하기`,
      test: (p) => p.block >= LONG_BLOCK,
    },
    {
      label: '짧게 끊어서 집중한 날',
      tip: '짧게 끊고 자주 쉬어 가기',
      test: (p) => p.block < LONG_BLOCK,
    },
  ],
  [
    { label: '한 과목만 공부한 날', tip: '한 번 입실에 한 과목씩', test: (p) => p.subjects === 1 },
    { label: '여러 과목을 오간 날', tip: '여러 과목을 오가며 공부하기', test: (p) => p.subjects >= 2 },
  ],
];

/**
 * The way of studying whose days finished the most detail goals, compared with the other way.
 * A tendency in this member's own records, not a cause.
 */
function wentWell(points) {
  const rated = points.filter((p) => p.doneRate != null);
  if (rated.length < MIN_COMPARE_VISITS) return null;
  const found = FACTORS.map((groups) => {
    const stats = groups
      .map((g) => {
        const list = rated.filter(g.test);
        return { ...g, count: list.length, rate: mean(list.map((p) => p.doneRate)) };
      })
      .filter((g) => g.count >= MIN_GROUP)
      .sort((a, b) => b.rate - a.rate);
    return stats.length >= 2 ? { best: stats[0], other: stats.at(-1) } : null;
  })
    .filter((f) => f && f.best.rate - f.other.rate >= MIN_GAP)
    .sort((a, b) => b.best.rate - b.other.rate - (a.best.rate - a.other.rate));
  return found[0] ?? { even: true };
}

/** The month's study pattern: visit points, type, balance against last month, what went well. */
export function summarizePattern(year, month) {
  const records = monthRecords(year, month);
  if (!records.length) return null;
  const points = records.map(visitPoint);
  const prev = month === 0 ? [year - 1, 11] : [year, month - 1];
  return {
    points,
    type: monthType(points),
    balance: balanceOf(year, month),
    prevBalance: balanceOf(...prev),
    prevMonth: prev[1],
    wentWell: wentWell(points),
  };
}

/** Each month with records, newest first, with the type it came out as (null if too few visits). */
export function monthlyTypes() {
  const months = [...new Set(RECORD_KEYS.map((key) => key.slice(0, 7)))].reverse();
  return months.map((ym) => {
    const [year, month] = ym.split('-').map(Number);
    const points = monthRecords(year, month - 1).map(visitPoint);
    return { key: ym, year, month: month - 1, visits: points.length, type: monthType(points) };
  });
}

/** Every visit that fell into the type `typeId`, newest first. */
export const visitsOfType = (typeId) =>
  RECORD_KEYS.filter((key) => key <= TODAY_KEY)
    .map((key) => visitPoint(RECORDS[key]))
    .filter((p) => p.type.id === typeId)
    .reverse();
