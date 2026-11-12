import { RECORDS, RECORD_KEYS, TODAY_KEY } from './records.js';

/** Group rooms; booked in 2H blocks with the booker's own pass (2H or 4H). */
export const STUDY_ROOMS = [
  { id: 'R1', name: '스터디룸 1', capacity: 4, desc: '화이트보드 · 모니터' },
  { id: 'R2', name: '스터디룸 2', capacity: 6, desc: '화이트보드 · 대형 TV' },
];

export const ROOM_HOURS = [2, 4];

/** Start hours of the 2H blocks a day is split into (08:00 – 24:00). */
export const ROOM_SLOTS = [8, 10, 12, 14, 16, 18, 20, 22];

export const ROOM_TITLES = ['면접 스터디', '그룹 과제', '스터디 모임'];

export const roomOf = (id) => STUDY_ROOMS.find((r) => r.id === id);

export const slotLabel = (start, hours) =>
  `${String(start).padStart(2, '0')}:00 — ${String((start + hours) % 24).padStart(2, '0')}:00`;

/** Other members' bookings, fixed per room and date so the timetable looks the same on every visit. */
export function isTakenByOthers(roomId, dateKey, start) {
  let hash = 2166136261;
  for (const c of `${roomId}|${dateKey}|${start}`) hash = Math.imul(hash ^ c.charCodeAt(0), 16777619);
  const busy = start >= 18 ? 0.55 : start >= 14 ? 0.35 : 0.2;
  return ((hash >>> 0) % 1000) / 1000 < busy;
}

/** Past room sessions on days the demo member also studied alone, for the RECORD screens. */
export const ROOM_HISTORY = Object.fromEntries(
  RECORD_KEYS.filter((key) => key < TODAY_KEY && RECORDS[key].endLabel <= '19:30')
    .filter((_, i) => i % 6 === 2)
    .map((key, i) => [
      key,
      {
        roomId: STUDY_ROOMS[i % 2].id,
        title: ['면접 스터디', '면접 스터디', '그룹 과제', '자소서 첨삭 스터디'][i % 4],
        start: 20,
        hours: 2,
      },
    ]),
);
