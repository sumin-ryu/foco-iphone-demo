import { PASS_TYPES } from '../store/AppStore.jsx';
import { FEEDBACK_MOODS, notesOf } from './feedback.js';
import { SLOTS, TODAY_KEY, parseKey } from './records.js';
import { subjectBase, subjectKey } from './subjects.js';

const HOUR_MS = 60 * 60 * 1000;
/** An hour bar with less focus than this (minutes) counts as "faded". */
export const FADE_MINUTES = 40;
const MAX_PASS_HOURS = PASS_TYPES.at(-1).hours;

const pad = (n) => String(n).padStart(2, '0');
const sum = (list, get) => list.reduce((total, x) => total + get(x), 0);
const mean = (list) => (list.length ? sum(list, (x) => x) / list.length : 0);

/** Minutes of focus or rest that fall within hour bar `h`. */
const minutesInHour = (report, h, rest) =>
  sum(
    report.timeline.filter((p) => p.rest === rest),
    (p) => Math.max(0, Math.min(p.to, (h + 1) * HOUR_MS) - Math.max(p.from, h * HOUR_MS)),
  ) / 60_000;

/**
 * A month of records turned into a review plus suggestions for planning the next month:
 * how focus held up hour by hour within a pass, when check-ins went best, how subjects and
 * their detail goals went, and which passes were used.
 */
export function summarizeMonth(allRecords, year, month) {
  const prefix = `${year}-${pad(month + 1)}`;
  const days = Object.values(allRecords)
    .filter((r) => r.key.startsWith(prefix))
    .sort((a, b) => a.key.localeCompare(b.key));
  if (!days.length) return null;
  const records = days.flatMap((d) => d.visits);

  const today = parseKey(TODAY_KEY);
  const inProgress = today.getFullYear() === year && today.getMonth() === month;
  const daysCounted = inProgress ? today.getDate() : new Date(year, month + 1, 0).getDate();

  const focus = sum(records, (r) => r.focus);
  const rest = sum(records, (r) => r.rest);
  const passMinutes = sum(records, (r) => r.pass * 60);

  // How each hour bar was spent on average (focus / rest / left unused), over the visits
  // whose pass covered that hour.
  const curve = Array.from({ length: MAX_PASS_HOURS }, (_, h) => {
    const covering = records.filter((r) => r.pass > h);
    if (!covering.length) return null;
    const avg = Math.round(mean(covering.map((r) => minutesInHour(r.report, h, false))));
    const rest = Math.round(mean(covering.map((r) => minutesInHour(r.report, h, true))));
    return { hour: h, count: covering.length, avg, rest, unused: Math.max(0, 60 - avg - rest) };
  }).filter(Boolean);
  const fadeIndex = curve.findIndex((c) => c.avg < FADE_MINUTES);
  const sustainedHours = fadeIndex === -1 ? curve.length : Math.max(1, fadeIndex);
  const recommendedPass =
    PASS_TYPES.find((p) => p.hours >= sustainedHours)?.hours ?? MAX_PASS_HOURS;
  const visitsPerWeek = Math.max(1, Math.round(records.length / (daysCounted / 7)));

  const slots = SLOTS.map((slot) => {
    const list = records.filter((r) => r.slot === slot.id);
    const used = sum(list, (r) => r.focus + r.rest);
    return {
      ...slot,
      count: list.length,
      focusRate: used ? sum(list, (r) => r.focus) / used : 0,
      avgFocus: list.length ? Math.round(sum(list, (r) => r.focus) / list.length) : 0,
    };
  });
  const rankedSlots = slots.filter((s) => s.count).sort((a, b) => b.focusRate - a.focusRate);
  const bestSlot = rankedSlots.find((s) => s.count >= 2) ?? rankedSlots[0];

  const weekdays = Array.from({ length: 7 }, (_, day) => {
    const list = records.filter((r) => parseKey(r.key).getDay() === day);
    return { day, count: list.length, focus: sum(list, (r) => r.focus) };
  });
  const bestDays = [...weekdays]
    .filter((d) => d.count)
    .sort((a, b) => b.focus - a.focus)
    .slice(0, 2)
    .map((d) => d.day)
    .sort((a, b) => a - b);

  // Names that only differ by a part number or note ("한국사 1", "한국사 2") count as one
  // subject; the time per written name is kept as `parts`.
  const subjectMap = new Map();
  for (const r of records) {
    const nameOf = new Map(r.report.subjects.map((s) => [s.id, s.name]));
    for (const s of r.report.subjects) {
      const key = subjectKey(s.name);
      const entry = subjectMap.get(key) ?? { key, goal: '', ms: 0, tasks: 0, done: 0, parts: new Map() };
      if (s.goal) entry.goal = s.goal;
      if (!entry.parts.has(s.name)) entry.parts.set(s.name, 0);
      subjectMap.set(key, entry);
    }
    for (const item of r.report.items) {
      const name = nameOf.get(item.subjectId);
      const entry = name && subjectMap.get(subjectKey(name));
      if (!entry) continue;
      entry.ms += item.ms;
      entry.tasks += 1;
      entry.done += item.done ? 1 : 0;
      entry.parts.set(name, entry.parts.get(name) + item.ms);
    }
  }
  const focusMs = focus * 60_000;
  const subjects = [...subjectMap.values()]
    .map(({ parts, ...s }) => {
      const names = [...parts.keys()];
      return {
        ...s,
        name: names.length === 1 ? names[0] : subjectBase(names[0]),
        parts:
          names.length === 1
            ? []
            : [...parts]
                .map(([name, ms]) => ({ name, share: focusMs ? ms / focusMs : 0 }))
                .sort((a, b) => a.name.localeCompare(b.name, 'ko', { numeric: true })),
        share: focusMs ? s.ms / focusMs : 0,
        doneRate: s.tasks ? s.done / s.tasks : 0,
      };
    })
    .sort((a, b) => b.ms - a.ms);

  // The subject whose detail goals lag most. If it already got its fair share of time, its
  // goals are too big; otherwise move some time to it from a subject that goes well.
  const lagging = subjects
    .filter((s) => s.tasks >= 2)
    .sort((a, b) => a.doneRate - b.doneRate)[0];
  const lagsInTime = lagging && lagging.share < 1 / subjects.length;
  const donor = lagsInTime
    ? subjects.find(
        (s) => s !== lagging && s.doneRate >= lagging.doneRate + 0.2 && s.share >= 0.15,
      )
    : null;
  const shift = donor ? Math.min(0.08, donor.share * 0.3) : 0;
  const subjectAdvice = !lagging ? null : donor ? 'shift' : lagsInTime ? null : 'split';
  const plannedShares = subjects.map((s) => ({
    name: s.name,
    goal: s.goal,
    now: s.share,
    next: s.share + (s === lagging ? shift : 0) - (s === donor ? shift : 0),
  }));

  // Self feedback: how rated visits compare, when the disappointing ones happened, and the
  // latest notes.
  const focusRate = (list) => {
    const used = sum(list, (r) => r.focus + r.rest);
    return used ? sum(list, (r) => r.focus) / used : 0;
  };
  const rated = records.filter((r) => r.report.feedback?.mood);
  const ratedAs = (id) => rated.filter((r) => r.report.feedback.mood === id);
  const badVisits = ratedAs('bad');
  const [badSlotTop] = SLOTS.map((slot) => ({
    slot,
    count: badVisits.filter((r) => r.slot === slot.id).length,
  })).sort((a, b) => b.count - a.count);
  const notes = records
    .map(notesOf)
    .filter((n) => n && (n.note || n.text))
    .reverse()
    .slice(0, 3);
  const feedback =
    rated.length || notes.length
      ? {
          rated: rated.length,
          moods: FEEDBACK_MOODS.map((m) => ({ ...m, count: ratedAs(m.id).length })),
          goodRate: ratedAs('good').length ? focusRate(ratedAs('good')) : null,
          badRate: badVisits.length ? focusRate(badVisits) : null,
          badSlot:
            badVisits.length >= 2 && badSlotTop.count * 2 >= badVisits.length ? badSlotTop.slot : null,
          notes,
        }
      : null;

  const passes = PASS_TYPES.map(({ hours }) => {
    const list = records.filter((r) => r.pass === hours);
    return {
      hours,
      count: list.length,
      avgUnused: list.length
        ? Math.round(sum(list, (r) => hours * 60 - r.focus - r.rest) / list.length)
        : 0,
    };
  }).filter((p) => p.count);

  return {
    year,
    month,
    inProgress,
    records,
    visits: days.length,
    focus,
    rest,
    passMinutes,
    utilization: passMinutes ? focus / passMinutes : 0,
    curve,
    fadeIndex,
    sustainedHours,
    recommendedPass,
    visitsPerWeek,
    slots,
    bestSlot,
    weekdays,
    bestDays,
    subjects,
    lagging,
    donor,
    subjectAdvice,
    plannedShares,
    passes,
    feedback,
  };
}
