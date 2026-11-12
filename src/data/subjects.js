const TRAILING_PART = /(?:\s*[(（[［].*[)）\]］]|[\s\-_.·#]*(?:\d+|[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ]+)|\s+[IVX]+)$/i;

/**
 * The subject a name belongs to, without a trailing part number or note:
 * "한국사 1", "한국사2", "한국사 (근현대)" and "한국사 Ⅱ" all become "한국사".
 */
export function subjectBase(name) {
  let base = name.trim().replace(/\s+/g, ' ');
  for (let next = base.replace(TRAILING_PART, ''); next && next !== base; ) {
    base = next;
    next = base.replace(TRAILING_PART, '');
  }
  return base || name.trim();
}

/** Grouping key: same base name, ignoring spaces and letter case. */
export const subjectKey = (name) => subjectBase(name).replace(/\s/g, '').toLowerCase();

/**
 * Subject names used before, from saved plans and focus records: most used subjects first,
 * with parts of the same subject ("한국사", "한국사 1", "한국사 2") kept side by side.
 * Each entry carries the latest goal written for it.
 */
export function pastSubjects(plans, records) {
  const byName = new Map();
  const add = (name, goal, weight) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const entry = byName.get(trimmed) ?? { name: trimmed, goal: '', count: 0 };
    entry.count += weight;
    if (goal && !entry.goal) entry.goal = goal;
    byName.set(trimmed, entry);
  };
  for (const plan of plans) for (const s of plan.subjects) add(s.name, s.goal, 2);
  const latestFirst = Object.values(records)
    .flatMap((day) => day.visits)
    .sort((a, b) => b.key.localeCompare(a.key) || b.start.localeCompare(a.start));
  for (const r of latestFirst) for (const s of r.report.subjects) add(s.name, s.goal, 1);
  const groupCount = new Map();
  for (const s of byName.values()) {
    const key = subjectKey(s.name);
    groupCount.set(key, (groupCount.get(key) ?? 0) + s.count);
  }
  const group = (s) => groupCount.get(subjectKey(s.name));
  return [...byName.values()].sort(
    (a, b) =>
      group(b) - group(a) ||
      subjectKey(a.name).localeCompare(subjectKey(b.name)) ||
      a.name.localeCompare(b.name, 'ko', { numeric: true }),
  );
}

/**
 * Past subjects matching what is typed so far (or sharing its base name, so "한국사3" still
 * offers "한국사 1"), excluding names already in use.
 */
export function suggestSubjects(past, typed, usedNames, limit = 4) {
  const query = typed.replace(/\s/g, '').toLowerCase();
  const key = query && subjectKey(typed);
  return past
    .filter((s) => !usedNames.has(s.name))
    .filter(
      (s) =>
        !query ||
        s.name.replace(/\s/g, '').toLowerCase().includes(query) ||
        subjectKey(s.name) === key,
    )
    .slice(0, limit);
}
