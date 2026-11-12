import { ITEM_COLORS } from '../data/focusColors.js';
import { getPlanName } from '../store/AppStore.jsx';

export const REST_KEY = 'rest';
/** The opening "go over last visit" item, added when a focus starts with a review. */
export const REVIEW_KEY = 'review';
export const REVIEW_LABEL = '지난번 복습';

/** Removes the parts of `span` that overlap any rest interval. */
function cutRests(span, rests) {
  return rests.reduce(
    (pieces, r) =>
      pieces.flatMap((p) =>
        r.to <= p.from || r.from >= p.to
          ? [p]
          : [
              p.from < r.from && { ...p, to: r.from },
              r.to < p.to && { ...p, from: r.to },
            ].filter(Boolean),
      ),
    [span],
  );
}

/**
 * One entry per detail goal; subjects without detail goals count as a single item. A focus
 * started with a review opens with the review item.
 */
function buildItems(plan, focus) {
  const items = (plan?.subjects ?? []).flatMap((s) => {
    const list = focus.tasks[s.id] ?? [];
    return list.length
      ? list.map((t) => ({ key: `t${t.id}`, label: t.text, subject: s.name, subjectId: s.id }))
      : [{ key: `s${s.id}`, label: s.name, subjectId: s.id }];
  });
  const withFallback = items.length ? items : [{ key: 'free', label: '자유 집중' }];
  const all = focus.review
    ? [{ key: REVIEW_KEY, label: REVIEW_LABEL, review: true }, ...withFallback]
    : withFallback;
  return all.map((item, i) => ({ ...item, color: ITEM_COLORS[i % ITEM_COLORS.length] }));
}

/** Groups a result's items under their subject; items without one (review, free focus) get their own group. */
export function groupBySubject(result) {
  const groups = (result.subjects ?? []).map((subject) => ({
    key: subject.id,
    subject,
    items: result.items.filter((item) => item.subjectId === subject.id),
  }));
  const known = new Set(groups.map((g) => g.key));
  for (const item of result.items) {
    if (!known.has(item.subjectId)) {
      groups.push({ key: item.key, subject: { name: item.label }, items: [item] });
    }
  }
  return groups.map((g) => ({
    ...g,
    ms: g.items.reduce((sum, item) => sum + item.ms, 0),
    hasDetails: g.items.some((item) => item.subject),
    review: g.items.some((item) => item.review),
  }));
}

/** Where the running focus session stands at `now`: items, the rest-cut timeline and per-key totals. */
export function summarizeFocus(focus, plan, now) {
  const elapsedMs = Math.max(0, now - focus.startedAt);
  const items = buildItems(plan, focus);
  const segments = focus.segments.length ? focus.segments : [{ key: items[0].key, from: 0 }];
  const spans = segments.map((s, i) => ({ ...s, to: segments[i + 1]?.from ?? elapsedMs }));
  const rests = (focus.rests ?? []).map((r) => ({ key: REST_KEY, from: r.from, to: r.to ?? elapsedMs }));
  const timeline = [...spans.flatMap((span) => cutRests(span, rests)), ...rests]
    .filter((p) => p.to > p.from)
    .sort((a, b) => a.from - b.from);
  const totals = new Map();
  for (const p of timeline) totals.set(p.key, (totals.get(p.key) ?? 0) + p.to - p.from);
  return {
    elapsedMs,
    items,
    currentKey: segments.at(-1).key,
    timeline,
    totals,
    restMs: totals.get(REST_KEY) ?? 0,
  };
}

/** The report saved when a focus session ends at `now` (completion page, check-out). */
export function buildFocusResult({ focus, plan, passHours, now, autoEnded = false }) {
  const { elapsedMs, items, timeline, totals, restMs } = summarizeFocus(focus, plan, now);
  return {
    startedAt: focus.startedAt,
    endedAt: focus.startedAt + elapsedMs,
    passHours,
    title: plan ? plan.memo || getPlanName(plan) : '자유 집중',
    focusMs: elapsedMs - restMs,
    subjects: (plan?.subjects ?? []).map(({ id, name, goal }) => ({ id, name, goal })),
    restMs,
    items: items.map((item) => ({
      ...item,
      ms: totals.get(item.key) ?? 0,
      done: focus.doneKeys.includes(item.key),
    })),
    timeline: timeline.map(({ key, from, to }) => ({ key, from, to, rest: key === REST_KEY })),
    note: (focus.note ?? '').trim(),
    autoEnded,
  };
}
