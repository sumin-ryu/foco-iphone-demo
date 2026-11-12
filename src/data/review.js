import { groupBySubject } from '../components/focusSummary.js';
import { RECORDS, RECORD_KEYS, TODAY_KEY, parseKey } from './records.js';

/** How the visit felt, picked in the review at check-out. */
export const REVIEW_MOODS = [
  { id: 'good', label: '잘 됐어요' },
  { id: 'okay', label: '보통이에요' },
  { id: 'bad', label: '아쉬워요' },
];

export const moodLabel = (id) => REVIEW_MOODS.find((m) => m.id === id)?.label ?? null;

/**
 * Detail goals the last visit left unfinished (`{ subject, label }`), suggested when planning
 * the next focus: this demo session's last result, otherwise the latest past demo visit.
 */
export function lastUnfinished(lastResult) {
  const source = lastResult ?? RECORDS[RECORD_KEYS.filter((key) => key < TODAY_KEY).at(-1)]?.report;
  if (!source) return [];
  return source.items
    .filter((item) => item.subject && !item.done)
    .map((item) => ({ subject: item.subject, label: item.label }));
}

/**
 * The review left on `result`, shaped for reading back: one line per subject with what to go
 * over again, and the mood. Null when nothing was left.
 */
export function reviewOf(result) {
  const review = result?.review;
  if (!review) return null;
  const lines = groupBySubject(result)
    .filter((g) => !g.review)
    .map((g) => ({ key: g.key, name: g.subject.name, text: review.notes?.[g.key]?.trim() ?? '' }))
    .filter((line) => line.text);
  if (!lines.length && !review.mood) return null;
  return { startedAt: result.startedAt, lines, mood: review.mood ?? null };
}

const hasNotes = (r) => Boolean(r?.lines.length);

/**
 * The review to go over before the next focus: the one written in this demo session if it has
 * notes, otherwise the latest past demo visit that left notes.
 */
export function latestReview(lastResult) {
  const own = reviewOf(lastResult);
  if (hasNotes(own)) return own;
  const pastKeys = RECORD_KEYS.filter((key) => key < TODAY_KEY);
  for (let i = pastKeys.length - 1; i >= 0; i -= 1) {
    const r = reviewOf(RECORDS[pastKeys[i]].report);
    if (hasNotes(r)) return r;
  }
  return null;
}

const slotOf = (hours) => (hours < 12 ? '오전' : hours < 18 ? '오후' : '저녁');
const pad = (n) => String(n).padStart(2, '0');

/** "어제 저녁 19:00", "오늘 오후 14:20", "10월 9일 오전 09:40" */
export function reviewWhen(startedAt, now) {
  const d = new Date(startedAt);
  const dayMs = 86_400_000;
  const startOf = (t) => new Date(t).setHours(0, 0, 0, 0);
  const days = Math.round((startOf(now) - startOf(startedAt)) / dayMs);
  const day = days === 0 ? '오늘' : days === 1 ? '어제' : `${d.getMonth() + 1}월 ${d.getDate()}일`;
  return `${day} ${slotOf(d.getHours())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const MINUTE = 60_000;
const BASELINE_DAYS = 30;

/** "1시간 12분", "52분" */
const toWords = (ms) => {
  const total = Math.round(ms / MINUTE);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (!h) return `${m}분`;
  return m ? `${h}시간 ${m}분` : `${h}시간`;
};

/** Longest stretch of focus without a rest, switching items included. */
function longestBlock(result) {
  let best = 0;
  let run = 0;
  for (const p of [...result.timeline].sort((a, b) => a.from - b.from)) {
    if (p.rest) {
      run = 0;
    } else {
      run += p.to - p.from;
      best = Math.max(best, run);
    }
  }
  return best;
}

const subjectCount = (result) =>
  groupBySubject(result).filter((g) => !g.review && g.ms > 0 && g.subject.id != null).length;

/** Average longest block and subject count over the past month of demo visits. */
function baseline() {
  const from = new Date(parseKey(TODAY_KEY).getTime() - BASELINE_DAYS * 86_400_000);
  const reports = RECORD_KEYS.filter((key) => key < TODAY_KEY && parseKey(key) >= from).map(
    (key) => RECORDS[key].report,
  );
  const avg = (fn) => reports.reduce((sum, r) => sum + fn(r), 0) / Math.max(1, reports.length);
  return { block: avg(longestBlock), subjects: avg(subjectCount) };
}

/**
 * One sentence comparing today with the usual, on the two pattern axes: how long focus runs
 * before a rest, and how many subjects a visit goes through.
 */
export function todayDiscovery(result) {
  const usual = baseline();
  const block = longestBlock(result);
  if (result.focusMs < 10 * MINUTE) {
    return `오늘은 짧게 집중했어요. 평소엔 한 번에 평균 ${toWords(usual.block)} 이어서 집중해요.`;
  }
  const diff = block - usual.block;
  if (Math.abs(diff) >= 10 * MINUTE) {
    return `오늘은 한 번에 최대 ${toWords(block)} 이어서 집중했어요. 평소보다 ${toWords(
      Math.abs(diff),
    )} ${diff > 0 ? '길어요' : '짧아요'}.`;
  }
  const count = subjectCount(result);
  const usualCount = Math.round(usual.subjects);
  if (count && count !== usualCount) {
    return `오늘은 ${count}과목을 오갔어요. 평소엔 ${usualCount}과목 정도예요.`;
  }
  return `오늘도 평소처럼 한 번에 ${toWords(block)} 안팎으로 이어서 집중했어요.`;
}
