import { getPassLevel } from '../store/AppStore.jsx';
import { ITEM_COLORS } from './focusColors.js';

export const toKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;

export const parseKey = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export const toClock = (minutes) =>
  `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

/** "7H 12M", "48M", "3H" */
export const formatHM = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m}M`;
  return m ? `${h}H ${m}M` : `${h}H`;
};

const SUBJECT_POOL = [
  { name: '국어', goal: '국어 90점 넘기기', tasks: ['비문학 3지문', '문학 개념 정리', '화법과 작문 기출'] },
  { name: '영어', goal: '영단어 3000개 마스터', tasks: ['단어 Day 12', '독해 2지문', '듣기 1회분'] },
  {
    name: '한국사',
    goal: '전 범위 3회독',
    tasks: ['근현대사 회독', '연표 암기'],
    parts: [
      { name: '한국사 1', tasks: ['전근대사 회독', '연표 암기'] },
      { name: '한국사 2', tasks: ['근현대사 회독', '연표 암기'] },
    ],
  },
  { name: '행정법', goal: '기출 5회독', tasks: ['행정행위 기출', '판례 정리', '오답 노트'] },
];

/** One-line "go over again" notes (missed questions, confusing ideas) written at check-out, by subject name. */
const REVIEW_NOTES = {
  국어: ['현대시 화자 태도 문제 2개 틀림', '비문학 과학 지문 구조 파악이 느림', '비유와 상징 구분이 헷갈림'],
  영어: ['관계대명사 what 문제 2개 틀림', 'Day 12 헷갈리는 단어 8개', '듣기 숫자 문제 2개 놓침'],
  '한국사 1': ['무신정권 집권자 순서 헷갈림', '조선 전기 왕별 업적이 섞임'],
  '한국사 2': ['1945~48년 사건 순서 헷갈림', '을사늑약과 정미7조약 구분'],
  행정법: ['행정행위 부관 문제 3개 틀림', '재량·기속 판례 구분 헷갈림', '취소와 철회 차이 다시 보기'],
};
const REVIEW_MOOD_IDS = ['good', 'good', 'okay', 'okay', 'bad'];

/** How often each subject comes up and how often its detail goals get finished. */
const SUBJECT_WEIGHT = [1, 1, 0.45, 1];
const DONE_RATE = [0.75, 0.8, 0.35, 0.65];

const MINUTE = 60_000;

/** Deterministic pseudo-random numbers so a day's record looks the same on every visit. */
const seeded = (seed) => {
  let state = seed % 2147483646 || 1;
  const next = () => {
    state = (state * 16807) % 2147483647;
    return state / 2147483647;
  };
  next();
  next();
  return next;
};

const pick = (random, list) => list[Math.floor(random() * list.length)];

/** A subject split into parts is written as one part per day, alternating by date. */
const subjectOn = ({ parts, ...subject }, date) =>
  parts ? { ...subject, ...parts[date.getDate() % parts.length] } : subject;

/** Chance of a visit per weekday (Sun–Sat). */
const VISIT_CHANCE = [0.3, 0.55, 0.7, 0.5, 0.7, 0.35, 0.65];

/**
 * Check-in time slots. Evenings get shorter passes and longer rests; mornings rest the least.
 * Mornings go long on one subject, evenings hop between subjects in short stretches
 * (`block` is the focus stretch range in minutes, `single` the chance of one subject).
 */
export const SLOTS = [
  { id: 'morning', label: '오전', starts: ['09:00', '09:20', '09:40', '10:00', '10:30'], passes: [4, 6, 8, 8], restFactor: 0.65, block: [52, 85], single: 0.55 },
  { id: 'afternoon', label: '오후', starts: ['13:00', '13:30', '14:00', '14:20', '15:00'], passes: [2, 4, 4, 6, 8], restFactor: 1, block: [32, 70], single: 0.3 },
  { id: 'evening', label: '저녁', starts: ['18:00', '18:30', '19:00', '19:30'], passes: [1, 2, 2, 4], restFactor: 2.2, block: [22, 42], single: 0.12 },
];
const SLOT_CHANCE = [0.38, 0.4, 0.22];
const DAYS_BACK = 95;

/**
 * Alternating focus / rest blocks (minutes) filling `used` minutes. Rests scale with the
 * stretch before them and get longer as the hours go on, jumping after the third hour, so
 * focus per hour fades in later hours.
 */
function buildBlocks(used, { restFactor, block: [min, max] }, random) {
  const blocks = [];
  let clock = 0;
  while (clock < used) {
    const hour = Math.floor(clock / 60);
    const focus = Math.min(used - clock, min + Math.round(random() * (max - min)));
    clock += focus;
    let rest = Math.round(
      (5 + random() * 4) * (focus / 58) * (1 + 0.35 * hour) * (hour >= 3 ? 1.5 : 1) * restFactor,
    );
    if (used - clock <= rest + 5) rest = 0;
    clock += rest;
    blocks.push({ focus, rest });
  }
  return blocks;
}

/**
 * Builds a focus report shaped like the one the focus screen produces: subjects with
 * detail goals, per-item time, and a timeline with rests (one item is revisited at the end).
 */
function buildReport({ random, date, start, pass, blocks, subjects: subjectIdx }) {
  const focus = blocks.reduce((sum, b) => sum + b.focus, 0);
  const rest = blocks.reduce((sum, b) => sum + b.rest, 0);
  const subjects = subjectIdx.map((i) => ({ id: i + 1, ...subjectOn(SUBJECT_POOL[i], date) }));
  // Long stretches on few subjects tend to finish more detail goals.
  const typicalBlock = blocks.reduce((sum, b) => sum + b.focus ** 2, 0) / focus;
  const doneFactor = (typicalBlock >= 50 ? 1.12 : 0.85) * (subjects.length >= 3 ? 0.9 : 1);

  const items = subjects.flatMap((s) => {
    const count = 1 + Math.floor(random() * s.tasks.length);
    return s.tasks.slice(0, count).map((label, t) => ({
      key: `d${s.id}-${t}`,
      label,
      subject: s.name,
      subjectId: s.id,
      done: random() < Math.min(0.97, DONE_RATE[s.id - 1] * doneFactor),
    }));
  });
  items.forEach((item, i) => (item.color = ITEM_COLORS[i % ITEM_COLORS.length]));

  const weights = items.map(() => 0.6 + random() * 0.8);
  const weightSum = weights.reduce((a, b) => a + b, 0);
  let left = focus;
  const minutes = weights.map((w, i) => {
    const m = i === items.length - 1 ? left : Math.max(5, Math.round((focus * w) / weightSum));
    left -= m;
    return m;
  });

  const order = items.map((item, i) => ({ key: item.key, minutes: minutes[i] }));
  if (order.length >= 3) {
    const revisit = Math.round(order[0].minutes * 0.35);
    order[0].minutes -= revisit;
    order.push({ key: order[0].key, minutes: revisit });
  }

  const rests = [];
  let focusedSoFar = 0;
  for (const b of blocks) {
    focusedSoFar += b.focus;
    if (b.rest) rests.push({ at: focusedSoFar, len: b.rest });
  }

  const timeline = [];
  let clock = 0;
  let focused = 0;
  for (const block of order) {
    let remaining = block.minutes;
    while (remaining > 0) {
      const nextRest = rests[0]?.at ?? Infinity;
      const chunk = Math.min(remaining, nextRest - focused);
      if (chunk > 0) {
        timeline.push({ key: block.key, from: clock * MINUTE, to: (clock + chunk) * MINUTE, rest: false });
        clock += chunk;
        focused += chunk;
        remaining -= chunk;
      }
      if (focused === nextRest) {
        const { len } = rests.shift();
        timeline.push({ key: 'rest', from: clock * MINUTE, to: (clock + len) * MINUTE, rest: true });
        clock += len;
      }
    }
  }

  const totals = new Map();
  for (const p of timeline) totals.set(p.key, (totals.get(p.key) ?? 0) + p.to - p.from);
  const [h, m] = start.split(':').map(Number);

  return {
    startedAt: new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m).getTime(),
    passHours: pass,
    title: subjects.map((s) => s.name).join(' · '),
    focusMs: focus * MINUTE,
    restMs: rest * MINUTE,
    subjects: subjects.map(({ id, name, goal }) => ({ id, name, goal })),
    items: items.map((item) => ({ ...item, ms: totals.get(item.key) ?? 0 })),
    timeline,
  };
}

/**
 * The review left at check-out: what to go over again on some subjects, and a mood. About a
 * quarter of visits leave none. Uses its own random stream so the visit itself stays the same.
 */
function buildReview(seed, report) {
  const random = seeded(seed + 7919);
  if (random() < 0.25) return null;
  const notes = {};
  for (const s of report.subjects) {
    const pool = REVIEW_NOTES[s.name];
    if (pool && random() < 0.75) notes[s.id] = pick(random, pool);
  }
  return { notes, mood: pick(random, REVIEW_MOOD_IDS) };
}

/** One day's demo visit, or null. Seeded by the date so a day never changes. */
function buildDay(date) {
  const seed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  const random = seeded(seed);
  if (random() > VISIT_CHANCE[date.getDay()]) return null;

  const roll = random();
  const slotIndex = roll < SLOT_CHANCE[0] ? 0 : roll < SLOT_CHANCE[0] + SLOT_CHANCE[1] ? 1 : 2;
  const slot = SLOTS[slotIndex];
  const start = pick(random, slot.starts);
  const pass = pick(random, slot.passes);

  // Usage never exceeds the pass: either nearly all of it, or leaving early (by less on a 1H pass).
  const passMin = pass * 60;
  const earlyBy = pass === 1 ? 6 : 25;
  const used =
    random() < 0.5
      ? passMin - Math.floor(random() * 12)
      : Math.max(pass === 1 ? 35 : 40, passMin - earlyBy - Math.floor(random() * Math.min(95, passMin * 0.4)));

  // A 1H visit is too short to split across subjects.
  const subjectCount = pass === 1 || random() < slot.single ? 1 : random() < 0.7 ? 2 : 3;
  const pool = [0, 1, 2, 3];
  const subjects = Array.from({ length: subjectCount }, () => {
    let roll = random() * pool.reduce((total, i) => total + SUBJECT_WEIGHT[i], 0);
    const at = pool.findIndex((i) => (roll -= SUBJECT_WEIGHT[i]) < 0);
    return pool.splice(at === -1 ? pool.length - 1 : at, 1)[0];
  });

  const blocks = buildBlocks(used, slot, random);
  const report = buildReport({ random, date, start, pass, blocks, subjects });
  report.review = buildReview(seed, report);
  return {
    start,
    slot: slot.id,
    pass,
    focus: report.focusMs / MINUTE,
    rest: report.restMs / MINUTE,
    plans: report.subjects.map((s) => s.name),
    report,
  };
}

const now = new Date();
export const TODAY_KEY = toKey(now);

/** Demo records for the past few months up to yesterday, placed relative to today. */
const DEMO_RECORDS = Object.fromEntries(
  Array.from({ length: DAYS_BACK }, (_, i) => {
    const daysAgo = i + 1;
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo);
    const day = buildDay(date);
    if (!day) return null;
    const key = toKey(date);
    return [
      key,
      {
        ...day,
        key,
        level: getPassLevel(day.pass),
        startLabel: day.start,
        endLabel: toClock(toMinutes(day.start) + day.focus + day.rest),
      },
    ];
  }).filter(Boolean),
);

const slotAt = (hour) => (hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening');
const clockOf = (date) => toClock(date.getHours() * 60 + date.getMinutes());

/** A record made from a finished focus session (the result the focus screen hands over). */
function recordFromResult(result) {
  const start = new Date(result.startedAt);
  const names = result.subjects.map((s) => s.name);
  return {
    key: toKey(start),
    start: clockOf(start),
    slot: slotAt(start.getHours()),
    pass: result.passHours,
    focus: Math.round(result.focusMs / MINUTE),
    rest: Math.round(result.restMs / MINUTE),
    plans: names.length ? names : [result.title],
    report: result,
    level: getPassLevel(result.passHours),
    startLabel: clockOf(start),
    endLabel: clockOf(new Date(result.endedAt)),
  };
}

/**
 * One calendar day. A single visit is the day itself; several visits (checking out and
 * coming back) add up, with the largest pass shown on the calendar.
 */
function toDay(visits) {
  const sorted = [...visits].sort((a, b) => a.start.localeCompare(b.start));
  if (sorted.length === 1) return { ...sorted[0], visits: sorted };
  return {
    key: sorted[0].key,
    visits: sorted,
    level: Math.max(...sorted.map((v) => v.level)),
    focus: sorted.reduce((sum, v) => sum + v.focus, 0),
    rest: sorted.reduce((sum, v) => sum + v.rest, 0),
    plans: [...new Set(sorted.flatMap((v) => v.plans))],
    startLabel: sorted[0].startLabel,
    endLabel: sorted.at(-1).endLabel,
  };
}

/**
 * Demo records plus the sessions finished in this app, by day. Each day keeps its visits in
 * `visits`; per-visit fields (pass, slot, report) live there.
 */
export function buildRecords(results) {
  const visitsByDay = new Map(Object.entries(DEMO_RECORDS).map(([key, r]) => [key, [r]]));
  for (const result of results) {
    const visit = recordFromResult(result);
    visitsByDay.set(visit.key, [...(visitsByDay.get(visit.key) ?? []), visit]);
  }
  const records = Object.fromEntries(
    [...visitsByDay].map(([key, visits]) => [key, toDay(visits)]),
  );
  const keys = Object.keys(records).sort();
  return {
    records,
    /** Ascending list of dates that have a record. */
    keys,
    /** Today if it has a record, otherwise the most recent past record. */
    defaultDate: keys.filter((key) => key <= TODAY_KEY).at(-1) ?? TODAY_KEY,
  };
}

/** Demo-only snapshot for modules that still read a static calendar (types, rooms). */
const DEMO = buildRecords([]);
export const RECORDS = DEMO.records;
export const RECORD_KEYS = DEMO.keys;
export const DEFAULT_RECORD_DATE = DEMO.defaultDate;
