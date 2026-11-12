/**
 * Dual-device check-in presentation beats: phone + kiosk side by side.
 * Frozen with `hold=` / story seeds — not a live QR walkthrough.
 */
export const CHECK_IN_STORY_SCENES = [
  {
    id: 'scan',
    title: 'QR 스캔',
    caption: ['폰이 키오스크 QR을 읽습니다.', '양쪽 화면이 동시에 맞춰져 있어요.'],
    phonePath: '/check-in',
    phoneParams: { hold: 'scan', scene: 'checkin-scan' },
    kioskPath: '/member',
    showKiosk: true,
  },
  {
    id: 'pass',
    title: '연결 · 이용권',
    caption: ['폰은 연결을 기다리고,', '키오스크에서 이용권을 고릅니다.'],
    phonePath: '/check-in',
    phoneParams: { hold: 'linking', scene: 'checkin-linking' },
    kioskPath: '/pass',
    showKiosk: true,
  },
  {
    id: 'seat',
    title: '좌석 선택',
    caption: ['좌석을 고르면', '입실이 마무리됩니다.'],
    phonePath: '/check-in',
    phoneParams: { hold: 'linking', scene: 'checkin-linking' },
    kioskPath: '/seat',
    showKiosk: true,
  },
  {
    id: 'done',
    title: '입실 완료',
    caption: ['폰에 세션이 열렸습니다.', '키오스크는 여기서 닫아도 돼요.'],
    phonePath: '/check-in',
    phoneParams: { scene: 'checkin-done' },
    kioskPath: '/done',
    showKiosk: true,
    canDismissKiosk: true,
  },
];

export function checkInPhoneUrl(scene, { origin = window.location.origin } = {}) {
  const params = new URLSearchParams({
    embed: '1',
    phone: '1',
    ...scene.phoneParams,
  });
  return `${origin}${scene.phonePath}?${params}`;
}

export function checkInKioskUrl(scene, { origin = window.location.origin } = {}) {
  // Always load `/kiosk/` (MPA entry). Deep paths like `/kiosk/member` fall through to the
  // phone app in Vite, so the beat is passed as `to=` for MemoryRouter.
  const params = new URLSearchParams({
    embed: '1',
    demo: 'off',
    member: '1',
    to: scene.kioskPath,
  });
  if (scene.kioskPath === '/seat' || scene.kioskPath === '/done') {
    params.set('hours', '4');
  }
  if (scene.kioskPath === '/done') {
    params.set('seat', 'A12');
  }
  return `${origin}/kiosk/?${params}`;
}
