/**
 * Study types, named after running events so the name alone tells how long a focus stretch
 * runs (`long`) and whether a visit covers several subjects (`multi`). Every name ends in 형,
 * which callers rely on for particles (으로 · 과 · 을).
 */
export const FOCUS_TYPES = [
  {
    id: 'sprint',
    name: '스프린트형',
    tag: '짧게 끊어서 · 한 과목',
    desc: '한 과목을 짧게 집중하고 쉬기를 반복해요.',
    long: false,
    multi: false,
    scenes: [
      '단어장 한 권을 25분 외우고 5분 쉬고, 같은 범위를 다시 외워요.',
      '기출 20문제를 풀고 쉬면서 채점한 뒤 다음 20문제로 넘어가요.',
      '같은 과목 인강을 한 강씩 듣고 쉬기를 반복해요.',
    ],
    fits: ['암기나 회독처럼 같은 범위를 여러 번 볼 때', '집중이 길게 이어지지 않는 날'],
    tries: [
      '한 구간에 끝낼 분량을 정해 두면 짧아도 끝맺음이 생겨요. (예: 단어 50개)',
      '쉬는 시간을 미리 정해 두면 다음 구간으로 넘어가기 쉬워요.',
    ],
  },
  {
    id: 'marathon',
    name: '마라톤형',
    tag: '길게 이어서 · 한 과목',
    desc: '한 과목을 오래 이어서 파고들어요.',
    long: true,
    multi: false,
    scenes: [
      '수학 한 단원을 처음부터 끝까지 한 번에 풀어요.',
      '서술형 답안을 끊지 않고 끝까지 써 내려가요.',
      '시험 전에 한 과목 전 범위를 길게 정리해요.',
    ],
    fits: ['긴 지문이나 서술처럼 흐름이 중요한 공부', '어려운 과목을 깊게 이해해야 할 때'],
    tries: [
      '끝낼 지점을 미리 정해 두면 길게 가도 덜 지쳐요.',
      '한 시간쯤 지나면 잠깐 일어나 몸을 풀어 보세요.',
    ],
  },
  {
    id: 'relay',
    name: '릴레이형',
    tag: '짧게 끊어서 · 여러 과목',
    desc: '여러 과목을 짧게 넘겨 가며 공부해요.',
    long: false,
    multi: true,
    scenes: [
      '국어 30분, 영어 30분, 한국사 30분을 돌아가며 해요.',
      '한 과목이 지루해질 즈음 다른 과목으로 넘어가요.',
      '시험 기간에 여러 과목을 조금씩 고르게 챙겨요.',
    ],
    fits: ['여러 과목을 고르게 챙겨야 하는 시험 기간', '한 과목만 오래 하면 지루해지는 날'],
    tries: [
      '과목 순서를 입실 전에 정해 두면 바통을 넘길 때 망설이지 않아요.',
      '넘어가기 전에 어디까지 했는지 한 줄 적어 두면 다음에 바로 이어져요.',
    ],
  },
  {
    id: 'triathlon',
    name: '철인3종형',
    tag: '길게 이어서 · 여러 과목',
    desc: '과목마다 길게 집중하며 여러 과목을 이어 가요.',
    long: true,
    multi: true,
    scenes: [
      '오전엔 국어를 두 시간, 오후엔 영어를 두 시간 해요.',
      '긴 이용권으로 하루에 여러 과목을 깊게 소화해요.',
    ],
    fits: ['6H · 8H처럼 긴 이용권으로 하루를 통째로 쓸 때', '과목마다 깊이가 필요한 공부'],
    tries: [
      '과목을 바꿀 때 휴식을 넣어 머리를 한 번 비워 보세요.',
      '가장 어려운 과목을 첫 구간에 두면 힘이 남아 있을 때 할 수 있어요.',
    ],
  },
];

export const ALL_ROUND = {
  id: 'allround',
  name: '올라운더형',
  tag: '상황에 따라',
  desc: '시간대나 상황에 따라 공부 방식을 바꿔요.',
  scenes: [
    '오전엔 한 과목을 길게, 저녁엔 여러 과목을 짧게 해요.',
    '시험 기간과 평소의 공부 방식이 달라요.',
  ],
  fits: ['일정이나 컨디션이 자주 바뀔 때', '과목마다 맞는 방식이 다를 때'],
  tries: [
    '월간 리포트에서 시간대별 유형을 보고, 어려운 과목을 잘 맞는 시간대에 두어 보세요.',
    '"잘 됐던 날처럼" 카드에서 세부 목표를 많이 끝낸 날의 방식을 확인해 보세요.',
  ],
};

export const ALL_TYPES = [...FOCUS_TYPES, ALL_ROUND];

export const typeById = (id) => ALL_TYPES.find((t) => t.id === id) ?? null;
