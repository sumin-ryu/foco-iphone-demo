import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { OCCUPIED_SEATS, SEATS as FLOOR_SEATS } from '../data/seats.js';
import { getStorySeed } from '../data/storyScenes.js';
import { clockNow } from '../hooks/useNow.js';

/** Same key as Onboarding — kept here so AppStore never imports that page module. */
const ONBOARDED_KEY = 'foco-onboarded';

export const USER = { name: '류수민' };

export const SEATS = {
  total: FLOOR_SEATS.length,
  occupied: [...OCCUPIED_SEATS],
};

/** Fallback when the phone demo runs without a live kiosk tab. */
export const DEMO_CHECK_IN = { seat: 'A12', passHours: 4 };

export const PASS_TYPES = [
  { hours: 1, name: 'ONE HOUR PASS', price: 1500, color: '#f0f4fc' },
  { hours: 2, name: 'TWO HOUR PASS', price: 3000, color: '#e4ecfa' },
  { hours: 4, name: 'FOUR HOUR PASS', price: 6000, color: '#cad8f1' },
  { hours: 6, name: 'SIX HOUR PASS', price: 9000, color: '#aabee5' },
  { hours: 8, name: 'EIGHT HOUR PASS', price: 12000, color: '#8699bd' },
];

const INITIAL_PASSES = { 1: 1, 2: 2, 4: 0, 6: 1, 8: 3 };

export const formatWon = (value) => `${value.toLocaleString('ko-KR')}원`;

export const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'];
const PLAN_EMOJIS = ['🔥', '📖', '📋', '✏️', '💡', '🎯', '🌱'];

let nextId = 100;
const uid = () => (nextId += 1);
const subject = (name, goal = '') => ({ id: uid(), name, goal, done: false });

/** Monday-based weekday index (월 = 0 … 일 = 6). */
export const getWeekdayIndex = (date = new Date()) => (date.getDay() + 6) % 7;

export const getPlanName = (plan) => `${WEEKDAYS[plan.day]}요일`;

const INITIAL_PLANS = [
  {
    id: 1,
    emoji: '🔥',
    day: 0,
    memo: '국어랑 영어 집중적으로 하기',
    subjects: [subject('국어', '국어 90점 넘기기'), subject('영어', '영단어 3000개 마스터'), subject('한국사')],
  },
  {
    id: 2,
    emoji: '📖',
    day: 1,
    memo: '영어랑 한국사 하기',
    subjects: [subject('영어', '독해 20분 안에 끝내기'), subject('한국사', '전 범위 3회독'), subject('행정법')],
  },
  {
    id: 3,
    emoji: '📋',
    day: 2,
    memo: '전공',
    subjects: [subject('행정법', '기출 5회독'), subject('행정학', '행정학 85점 넘기기')],
  },
  {
    id: 4,
    emoji: '🔥',
    day: 3,
    memo: '국어랑 영어 복습하기',
    subjects: [subject('국어', '국어 90점 넘기기'), subject('영어'), subject('한국사', '전 범위 3회독')],
  },
];

const toClock = (date) =>
  `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

/** One asterisk stroke per 2 hours of pass time (4H → "+"); 1H is half a stroke, a single ray. */
export const getPassLevel = (passHours) =>
  passHours < 2 ? 0.5 : Math.min(4, Math.round(passHours / 2));

export const getRestElapsed = (focus, now) =>
  focus.restTotal + (focus.restStartedAt ? now - focus.restStartedAt : 0);

export const getFocusElapsed = (focus, now) =>
  Math.max(0, now - focus.startedAt - getRestElapsed(focus, now));

/**
 * `tasks` maps subject id → detail goal strings. `review` is the last visit's review (see
 * `latestReview`) when the focus opens by going over it, otherwise null.
 */
const newFocus = (planId, tasks, review = null) => ({
  startedAt: clockNow(),
  review,
  restTotal: 0,
  restStartedAt: null,
  /** `{ from, to }` in ms since `startedAt`; `to` is null while resting. */
  rests: [],
  planId,
  tasks: Object.fromEntries(
    Object.entries(tasks).map(([subjectId, texts]) => [
      subjectId,
      texts.map((text) => ({ id: uid(), text })),
    ]),
  ),
  /** `{ key, from }` in ms since `startedAt`; empty until the first switch. */
  segments: [],
  doneKeys: [],
  /** A quick note jotted down while focusing. */
  note: '',
});

/** `notes` maps a report group key (subject id) → what to go over again (missed questions, confusing ideas). */
const EMPTY_REVIEW = { notes: {}, mood: null };

const AppStoreContext = createContext(null);

const STORAGE_KEY = 'foco-app-v2';
/** Story popup iframes keep their own snapshot so the main demo is never overwritten. */
const STORY_STORAGE_KEY = 'foco-app-story-v1';

/** Largest numeric `id` anywhere in `value`, so new ids never collide with saved ones. */
const maxId = (value) => {
  if (Array.isArray(value)) return Math.max(0, ...value.map(maxId));
  if (!value || typeof value !== 'object') return 0;
  const own = typeof value.id === 'number' ? value.id : 0;
  return Math.max(own, ...Object.values(value).map(maxId));
};

/** `?scene=` from the URL, set once when the provider mounts (story iframe boot). */
function readSceneId() {
  try {
    return new URLSearchParams(window.location.search).get('scene');
  } catch {
    return null;
  }
}

/**
 * State saved by a previous visit, so a refresh keeps records, plans and a running session.
 * `exists` is false on first boot (no key yet) — demos then start already checked in.
 */
function loadSaved(key = STORAGE_KEY) {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return { exists: false, saved: {} };
    const saved = JSON.parse(raw) ?? {};
    nextId = Math.max(nextId, maxId(saved));
    return { exists: true, saved };
  } catch {
    return { exists: false, saved: {} };
  }
}

function buildSession({ seat, passHours }) {
  const start = new Date(clockNow());
  const end = new Date(start.getTime() + passHours * 3_600_000);
  return {
    seat,
    passHours,
    passLevel: getPassLevel(passHours),
    startedAt: start.getTime(),
    startLabel: toClock(start),
    endLabel: toClock(end),
  };
}

export function AppStoreProvider({ children }) {
  const [sceneId] = useState(readSceneId);
  const [storySeed] = useState(() => (sceneId ? getStorySeed(sceneId) : null));
  const storageKey = storySeed ? STORY_STORAGE_KEY : STORAGE_KEY;
  const [{ exists: hadSave, saved }] = useState(() =>
    storySeed ? { exists: false, saved: {} } : loadSaved(storageKey),
  );

  /** First visit: open already checked in so the home hero isn’t CHECK-IN CONNECT. */
  const [session, setSession] = useState(
    () =>
      storySeed?.session ??
      (hadSave ? (saved.session ?? null) : buildSession(DEMO_CHECK_IN)),
  );
  /** Phone linked via QR; waiting for the kiosk to finish pass + seat. */
  const [linking, setLinking] = useState(false);
  const [focus, setFocus] = useState(storySeed?.focus ?? saved.focus ?? null);
  /** Summary of the session that just ended, shown on the completion page. */
  const [lastResult, setLastResult] = useState(storySeed?.lastResult ?? saved.lastResult ?? null);
  /** Every session finished in this app, oldest first; they become calendar records. */
  const [results, setResults] = useState(storySeed?.results ?? saved.results ?? []);
  /** Whether the next focus opens by going over the last review. */
  const [reviewFirst, setReviewFirst] = useState(storySeed?.reviewFirst ?? true);
  const [plans, setPlans] = useState(saved.plans ?? INITIAL_PLANS);
  const [highlightPlanId, setHighlightPlanId] = useState(null);
  const [passes, setPasses] = useState(saved.passes ?? INITIAL_PASSES);
  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    if (!storySeed) return;
    localStorage.setItem(ONBOARDED_KEY, '1');
  }, [storySeed]);

  useEffect(() => {
    const state = { session, focus, lastResult, results, plans, passes };
    localStorage.setItem(storageKey, JSON.stringify(state));
  }, [storageKey, session, focus, lastResult, results, plans, passes]);

  const value = useMemo(
    () => ({
      session,
      linking,
      /** QR matched a member — wait for kiosk pass/seat before the visit starts. */
      linkSession: () => {
        setSession(null);
        setLinking(true);
      },
      cancelLink: () => setLinking(false),
      /**
       * Visit is ready. `payload` comes from the kiosk bridge; without it, demo defaults apply
       * (phone-only demo when no kiosk tab is open).
       */
      connectSession: (payload = DEMO_CHECK_IN) => {
        const seat = payload.seat ?? DEMO_CHECK_IN.seat;
        const passHours = payload.passHours ?? DEMO_CHECK_IN.passHours;
        setLinking(false);
        setSession(buildSession({ seat, passHours }));
      },

      focus,
      /**
       * `tasks` maps subject id → today's detail goals (string list) for this visit only;
       * the plan's saved goal stays as the long-term goal.
       */
      startFocus: (planId = null, tasks = {}, review = null) =>
        setFocus((prev) => prev ?? newFocus(planId, tasks, review)),
      /**
       * Starts with a one-off plan made on the spot; it lives on the focus session only and is
       * never saved to MY PLAN. `subjects` is `[{ name, tasks: string[] }]`.
       */
      startQuickFocus: (subjects, review = null) =>
        setFocus((prev) => {
          if (prev) return prev;
          const quickPlan = {
            memo: '즉흥 플랜',
            subjects: subjects.map((s) => ({ id: uid(), name: s.name, goal: '' })),
          };
          const tasks = Object.fromEntries(
            quickPlan.subjects.map((s, i) => [s.id, subjects[i].tasks]),
          );
          return { ...newFocus(null, tasks, review), quickPlan };
        }),
      /**
       * Starts working on `key` at `at` ms since `startedAt`. `firstKey` seeds the implicit opening
       * segment; `completeKey` marks the item being left as finished. Returning to a
       * finished item reopens it.
       */
      switchFocusItem: ({ key, at, firstKey, completeKey }) =>
        setFocus((prev) => {
          if (!prev) return prev;
          const segments = prev.segments.length ? prev.segments : [{ key: firstKey, from: 0 }];
          const doneKeys = prev.doneKeys.filter((k) => k !== key && k !== completeKey);
          return {
            ...prev,
            segments: [...segments, { key, from: at }],
            doneKeys: completeKey ? [...doneKeys, completeKey] : doneKeys,
          };
        }),
      /** Puts back `segments`/`doneKeys` captured before a switch (undo). */
      restoreFocusItems: ({ segments, doneKeys }) =>
        setFocus((prev) => (prev ? { ...prev, segments, doneKeys } : prev)),
      toggleFocusDone: (key) =>
        setFocus((prev) =>
          prev
            ? {
                ...prev,
                doneKeys: prev.doneKeys.includes(key)
                  ? prev.doneKeys.filter((k) => k !== key)
                  : [...prev.doneKeys, key],
              }
            : prev,
        ),
      setFocusNote: (note) => setFocus((prev) => (prev ? { ...prev, note } : prev)),
      toggleRest: () =>
        setFocus((prev) => {
          if (!prev) return prev;
          const now = clockNow();
          if (prev.restStartedAt) {
            return {
              ...prev,
              restTotal: prev.restTotal + now - prev.restStartedAt,
              restStartedAt: null,
              rests: prev.rests.map((r) => (r.to == null ? { ...r, to: now - prev.startedAt } : r)),
            };
          }
          return {
            ...prev,
            restStartedAt: now,
            rests: [...prev.rests, { from: now - prev.startedAt, to: null }],
          };
        }),
      lastResult,
      results,
      /** Merges `patch` into the review being written for the last result. */
      updateReview: (patch) => {
        if (!lastResult) return;
        const next = {
          ...lastResult,
          review: { ...EMPTY_REVIEW, ...lastResult.review, ...patch },
        };
        setLastResult(next);
        setResults((all) => all.map((r) => (r.startedAt === lastResult.startedAt ? next : r)));
      },
      reviewFirst,
      setReviewFirst,
      /** Ends the focus record only; the visit goes on until `checkOut`. */
      endFocus: (result = null) => {
        setLastResult(result);
        if (result) setResults((prev) => [...prev, result]);
        setFocus(null);
      },
      /** Leaves the cafe. `focusResult` is the report of a focus session still running at check-out. */
      checkOut: (focusResult = null) => {
        if (focusResult) {
          setLastResult(focusResult);
          setResults((prev) => [...prev, focusResult]);
        }
        setFocus(null);
        setSession(null);
        setLinking(false);
      },
      /** Adds to the session that just ended, e.g. the self feedback written afterwards. */
      updateLastResult: (patch) => {
        if (!lastResult) return;
        const next = { ...lastResult, ...patch };
        setLastResult(next);
        setResults((all) => all.map((r) => (r.startedAt === lastResult.startedAt ? next : r)));
      },

      passes,
      /** Back to the demo's starting point: no records of its own, the sample plans and passes. */
      resetApp: () => {
        setSession(null);
        setLinking(false);
        setFocus(null);
        setLastResult(null);
        setResults([]);
        setPlans(INITIAL_PLANS);
        setPasses(INITIAL_PASSES);
        setReservations([]);
      },
      /** `cart` maps pass hours to quantity, e.g. `{ 2: 2, 4: 1 }`. */
      purchasePasses: (cart) =>
        setPasses((prev) => {
          const next = { ...prev };
          for (const [hours, qty] of Object.entries(cart)) next[hours] = (next[hours] ?? 0) + qty;
          return next;
        }),

      reservations,
      /**
       * Books a study room block with one of the member's passes (`passHours` ≥ `hours`, since a
       * pass is the most time it can cover). Returns the new reservation id.
       */
      reserveRoom: ({ roomId, date, start, hours, title, passHours }) => {
        const id = uid();
        setReservations((prev) => [...prev, { id, roomId, date, start, hours, title, passHours }]);
        setPasses((prev) => ({ ...prev, [passHours]: Math.max(0, (prev[passHours] ?? 0) - 1) }));
        return id;
      },
      /** Cancels a booking and gives its pass back. */
      cancelReservation: (id) => {
        const target = reservations.find((r) => r.id === id);
        if (!target) return;
        setReservations((prev) => prev.filter((r) => r.id !== id));
        setPasses((prev) => ({ ...prev, [target.passHours]: (prev[target.passHours] ?? 0) + 1 }));
      },

      plans,
      highlightPlanId,
      addPlan: ({ day, memo, subjects }) => {
        const id = uid();
        setPlans((prev) => [
          ...prev,
          {
            id,
            day,
            emoji: PLAN_EMOJIS[prev.length % PLAN_EMOJIS.length],
            memo,
            subjects: subjects.map((s) => subject(s.name, s.goal)),
          },
        ]);
        setHighlightPlanId(id);
        return id;
      },
      /** Subjects that keep their `id` also keep their checked state. */
      updatePlan: (id, { day, memo, subjects }) => {
        setPlans((prev) =>
          prev.map((p) => {
            if (p.id !== id) return p;
            const byId = new Map(p.subjects.map((s) => [s.id, s]));
            return {
              ...p,
              day,
              memo,
              subjects: subjects.map((s) =>
                byId.has(s.id)
                  ? { ...byId.get(s.id), name: s.name, goal: s.goal }
                  : subject(s.name, s.goal),
              ),
            };
          }),
        );
        setHighlightPlanId(id);
      },
      clearHighlightPlan: () => setHighlightPlanId(null),
      removePlan: (id) => setPlans((prev) => prev.filter((p) => p.id !== id)),
    }),
    [
      session,
      linking,
      focus,
      lastResult,
      results,
      reviewFirst,
      passes,
      reservations,
      plans,
      highlightPlanId,
    ],
  );

  return (
    <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>
  );
}

export function useAppStore() {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error('useAppStore must be used within AppStoreProvider');
  return ctx;
}
