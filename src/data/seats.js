/**
 * Study cafe floor plan shared by the app (좌석 현황) and the kiosk (좌석 선택).
 * Coordinates are in desk units (one desk = 1 × 1); screens pick the px size of a unit.
 */
export const FLOOR = { width: 13.2, height: 16 };

export const SEAT_ZONES = [
  { id: 'A', name: '집중실', desc: '1인 칸막이석 · 대화 금지', marker: [1.75, 5] },
  { id: 'B', name: '오픈석', desc: '6인 테이블 · 낮은 칸막이', marker: [7.7, 6.3] },
  { id: 'C', name: '창가석', desc: '창을 보는 바 테이블', marker: [4.45, 0.5] },
  { id: 'D', name: '노트북석', desc: '좌석마다 콘센트 · 타이핑 가능', marker: [11.2, 6.1] },
];

const line = (zone, from, count, x, y, dx, dy, chair) =>
  Array.from({ length: count }, (_, i) => ({
    id: `${zone}${from + i}`,
    zone,
    x: x + i * dx,
    y: y + i * dy,
    chair,
  }));

/** Two desks side by side, `rows` deep, with chairs on the outer sides. */
const island = (zone, from, x, y, rows) =>
  Array.from({ length: rows }, (_, r) => [
    { id: `${zone}${from + r * 2}`, zone, x, y: y + r, chair: 'left' },
    { id: `${zone}${from + r * 2 + 1}`, zone, x: x + 1, y: y + r, chair: 'right' },
  ]).flat();

export const SEATS = [
  ...line('A', 1, 10, 0, 0, 0, 1, 'right'),
  ...line('A', 11, 10, 2.5, 0, 0, 1, 'left'),
  ...island('B', 1, 5, 2.6, 3),
  ...island('B', 7, 8.4, 2.6, 3),
  ...island('B', 13, 5, 7, 3),
  ...island('B', 19, 8.4, 7, 3),
  ...line('C', 1, 8, 5.2, 0, 1, 0, 'bottom'),
  ...line('D', 1, 8, 12.2, 2.6, 0, 1, 'left'),
];

/** Walls and non-seat areas, drawn under the seats. */
export const AREAS = [
  { kind: 'window', x: 3.7, y: 0, w: 9.5, h: 0.08 },
  { kind: 'wall', x: 3.6, y: 0, w: 0.1, h: 10.35 },
  { kind: 'wall', x: 0, y: 10.25, w: 1.2, h: 0.1 },
  { kind: 'wall', x: 2.4, y: 10.25, w: 1.3, h: 0.1 },
  { kind: 'room', room: 'R1', label: '스터디룸 1', sub: '4인 · 예약제', x: 0, y: 11.1, w: 3.7, h: 2.3 },
  { kind: 'room', room: 'R2', label: '스터디룸 2', sub: '6인 · 예약제', x: 0, y: 13.6, w: 3.7, h: 2.4 },
  { kind: 'locker', label: '사물함', x: 5, y: 11.3, w: 4.4, h: 0.55 },
  { kind: 'lounge', label: '라운지', sub: '커피 · 간식 · 프린터', x: 9.9, y: 11.3, w: 3.3, h: 4.7 },
  { kind: 'kiosk', label: '키오스크', x: 8.1, y: 15.35, w: 1.5, h: 0.65 },
  { kind: 'entrance', label: '입구', x: 5.3, y: 15.35, w: 2.5, h: 0.65 },
];

export const OCCUPIED_SEATS = new Set([
  'A2', 'A3', 'A5', 'A8', 'A14', 'A17', 'A19',
  'B1', 'B4', 'B6', 'B9', 'B13', 'B18', 'B22',
  'C2', 'C5',
  'D3', 'D6',
]);

export const zoneOf = (id) => SEAT_ZONES.find((z) => z.id === id[0]);

/** "A12" → "집중실 A12" */
export const seatLabel = (id) => `${zoneOf(id)?.name ?? ''} ${id}`.trim();

export const zoneStats = SEAT_ZONES.map((zone) => {
  const seats = SEATS.filter((s) => s.zone === zone.id);
  const used = seats.filter((s) => OCCUPIED_SEATS.has(s.id)).length;
  return { ...zone, total: seats.length, available: seats.length - used };
});
