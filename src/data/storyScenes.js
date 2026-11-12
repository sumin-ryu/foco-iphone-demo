import { clockNow } from '../hooks/useNow.js';

/** Mirrors `getPassLevel` — kept local so this module never imports AppStore (cycle). */
const passLevelOf = (passHours) =>
  passHours < 2 ? 0.5 : Math.min(4, Math.round(passHours / 2));

const HOUR = 3_600_000;
const MINUTE = 60_000;

/** Presentation scenes: each one is a frozen UX beat, not a feature toggle. */
export const STORY_SCENES = [
  {
    id: 'review-plan',
    title: '다음 방문 · 플랜',
    caption: ['입실을 다시 밟지 않고, 플랜 앞에 지난번 복습이', '보이는 순간으로 옵니다.'],
    path: '/focus/plan',
  },
  {
    id: 'review-focus',
    title: '집중 · 복습 10분',
    caption: ['복습으로 시작하면', '첫 항목이 지난번 복습입니다.'],
    path: '/focus',
  },
];

export const storySceneIndex = (id) => STORY_SCENES.findIndex((s) => s.id === id);

export const storySceneById = (id) => STORY_SCENES.find((s) => s.id === id) ?? null;

const toClock = (date) =>
  `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

function buildSession({ seat, passHours }) {
  const start = new Date(clockNow());
  const end = new Date(start.getTime() + passHours * HOUR);
  return {
    seat,
    passHours,
    passLevel: passLevelOf(passHours),
    startedAt: start.getTime(),
    startLabel: toClock(start),
    endLabel: toClock(end),
  };
}

/** A finished visit that already left review notes — the bridge between “done” and “next”. */
function makeStoryResult() {
  const startedAt = clockNow() - 26 * HOUR;
  const focusMs = 110 * MINUTE;
  const restMs = 20 * MINUTE;
  const subjects = [
    { id: 901, name: '국어', goal: '국어 90점 넘기기' },
    { id: 902, name: '영어', goal: '영단어 3000개 마스터' },
  ];
  return {
    startedAt,
    endedAt: startedAt + focusMs + restMs,
    passHours: 4,
    title: '국어랑 영어 집중적으로 하기',
    focusMs,
    restMs,
    subjects,
    items: [
      {
        key: 's901',
        label: '국어',
        subject: '국어',
        subjectId: 901,
        color: '#5b7cfa',
        ms: 65 * MINUTE,
        done: true,
      },
      {
        key: 's902',
        label: '영어',
        subject: '영어',
        subjectId: 902,
        color: '#3db8a0',
        ms: 45 * MINUTE,
        done: false,
      },
    ],
    timeline: [],
    note: '',
    autoEnded: false,
    review: {
      notes: {
        901: '비문학 추론 문제',
        902: '동의어 헷갈린 단어',
      },
      mood: 'okay',
    },
    feedback: { mood: 'okay', text: '' },
  };
}

/**
 * App store snapshot for a story scene. Isolated from the main demo via a separate
 * localStorage key in `AppStoreProvider`.
 */
/** Shape expected by `LastReview` / focus `review` — built here to avoid importing review.js. */
function storyReview(lastResult) {
  return {
    startedAt: lastResult.startedAt,
    mood: lastResult.review?.mood ?? null,
    lines: lastResult.subjects.map((s) => ({
      key: s.id,
      name: s.name,
      text: lastResult.review?.notes?.[s.id] ?? '',
    })),
  };
}

export function getStorySeed(sceneId) {
  const lastResult = makeStoryResult();
  const review = storyReview(lastResult);
  const session = buildSession({ seat: 'A12', passHours: 4 });

  if (sceneId === 'checkin-scan' || sceneId === 'checkin-linking') {
    return {
      session: null,
      focus: null,
      lastResult: null,
      results: [],
      reviewFirst: true,
    };
  }

  if (sceneId === 'checkin-done') {
    return {
      session,
      focus: null,
      lastResult: null,
      results: [],
      reviewFirst: true,
    };
  }

  if (sceneId === 'review-plan') {
    return {
      session,
      focus: null,
      lastResult,
      results: [lastResult],
      reviewFirst: true,
    };
  }

  if (sceneId === 'review-focus') {
    return {
      session,
      focus: {
        startedAt: clockNow() - 3 * MINUTE,
        review,
        restTotal: 0,
        restStartedAt: null,
        rests: [],
        planId: 1,
        tasks: {},
        segments: [],
        doneKeys: [],
        note: '',
      },
      lastResult,
      results: [lastResult],
      reviewFirst: true,
    };
  }

  return null;
}

/** iframe URL for a scene inside the story popup. */
export function storySceneUrl(scene, { origin = window.location.origin } = {}) {
  const params = new URLSearchParams({
    embed: '1',
    /** Match IPhoneFrame screen insets so content isn’t crushed under the notch overlay. */
    phone: '1',
    scene: scene.id,
  });
  return `${origin}${scene.path}?${params}`;
}
