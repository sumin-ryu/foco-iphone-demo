import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import FocusMark from '../components/FocusMark.jsx';
import PageHeader from '../components/PageHeader.jsx';
import {
  ROOM_HOURS,
  ROOM_SLOTS,
  ROOM_TITLES,
  STUDY_ROOMS,
  isTakenByOthers,
  roomOf,
  slotLabel,
} from '../data/rooms.js';
import { parseKey, toKey } from '../data/records.js';
import { PASS_TYPES, getPassLevel, useAppStore } from '../store/AppStore.jsx';
import './pages.css';
import './Rooms.css';

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
const DAYS_AHEAD = 7;

const dateLabel = (key) => {
  const d = parseKey(key);
  return `${d.getMonth() + 1}.${d.getDate()} (${DAY_NAMES[d.getDay()]})`;
};

function useDays() {
  const [today] = useState(() => new Date());
  return Array.from({ length: DAYS_AHEAD }, (_, i) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    return { key: toKey(date), date, label: i === 0 ? '오늘' : i === 1 ? '내일' : DAY_NAMES[date.getDay()] };
  });
}

export default function Rooms() {
  const { passes, reservations, reserveRoom, cancelReservation } = useAppStore();
  const [params] = useSearchParams();
  const days = useDays();
  const [roomId, setRoomId] = useState(roomOf(params.get('room') ?? '')?.id ?? STUDY_ROOMS[0].id);
  const [dateKey, setDateKey] = useState(days[0].key);
  const [hours, setHours] = useState(ROOM_HOURS[0]);
  const [start, setStart] = useState(null);
  const [title, setTitle] = useState('');
  const [passChoice, setPassChoice] = useState(null);
  const [bookedId, setBookedId] = useState(null);

  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

  const slotState = (slot) => {
    if (reservations.some((r) => r.roomId === roomId && r.date === dateKey && r.start <= slot && slot < r.start + r.hours)) {
      return 'mine';
    }
    if (isTakenByOthers(roomId, dateKey, slot)) return 'taken';
    if (dateKey === days[0].key && slot * 60 <= nowMinutes) return 'past';
    return 'free';
  };
  const canStartAt = (slot) =>
    Array.from({ length: hours / 2 }, (_, i) => slot + i * 2).every(
      (s) => ROOM_SLOTS.includes(s) && slotState(s) === 'free',
    );
  const inSelection = (slot) => start !== null && slot >= start && slot < start + hours;

  const passOptions = PASS_TYPES.filter((p) => p.hours >= hours && (passes[p.hours] ?? 0) > 0);
  const passHours = passOptions.some((p) => p.hours === passChoice) ? passChoice : passOptions[0]?.hours ?? null;
  const room = roomOf(roomId);
  const ready = start !== null && passHours !== null;

  const changeHours = (h) => {
    setHours(h);
    setStart(null);
  };
  const changeDate = (key) => {
    setDateKey(key);
    setStart(null);
  };
  const changeRoom = (id) => {
    setRoomId(id);
    setStart(null);
  };

  const book = () => {
    const id = reserveRoom({ roomId, date: dateKey, start, hours, title: title.trim() || '스터디룸 이용', passHours });
    setBookedId(id);
    setStart(null);
    setTitle('');
    document.querySelector('.app__scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sorted = [...reservations].sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));

  return (
    <>
      <PageHeader title="스터디룸 예약" />
      <div className="page rooms">
        {sorted.length > 0 && (
          <section>
            <h2 className="section-title">내 예약</h2>
            <ul className="card rooms__mine">
              {sorted.map((r) => (
                <li key={r.id} className={`rooms__booking ${r.id === bookedId ? 'is-new' : ''}`}>
                  <FocusMark level={getPassLevel(r.passHours)} size={30} strokeWidth={1.6} />
                  <div className="rooms__booking-text">
                    <p className="rooms__booking-title">
                      {roomOf(r.roomId).name} · {r.title}
                    </p>
                    <p className="list__sub">
                      {dateLabel(r.date)} {slotLabel(r.start, r.hours)} · {r.passHours}H PASS 사용
                    </p>
                  </div>
                  <button type="button" className="rooms__cancel" onClick={() => cancelReservation(r.id)}>
                    취소
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h2 className="section-title">스터디룸</h2>
          <div className="rooms__rooms">
            {STUDY_ROOMS.map((r) => (
              <button
                key={r.id}
                type="button"
                className={`rooms__room ${r.id === roomId ? 'is-selected' : ''}`}
                aria-pressed={r.id === roomId}
                onClick={() => changeRoom(r.id)}
              >
                <span className="rooms__room-name">{r.name}</span>
                <span className="rooms__room-meta">최대 {r.capacity}인</span>
                <span className="rooms__room-meta">{r.desc}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="section-title">날짜</h2>
          <div className="rooms__days">
            {days.map((d) => (
              <button
                key={d.key}
                type="button"
                className={`rooms__day ${d.key === dateKey ? 'is-selected' : ''}`}
                aria-pressed={d.key === dateKey}
                onClick={() => changeDate(d.key)}
              >
                <span>{d.label}</span>
                <strong>{d.date.getDate()}</strong>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="section-title">
            이용 시간
            <span className="rooms__hint">2H · 4H 단위로 예약해요</span>
          </h2>
          <div className="rooms__hours" role="radiogroup" aria-label="이용 시간">
            {ROOM_HOURS.map((h) => (
              <button
                key={h}
                type="button"
                role="radio"
                aria-checked={h === hours}
                className={`rooms__hour ${h === hours ? 'is-selected' : ''}`}
                onClick={() => changeHours(h)}
              >
                {h}H
              </button>
            ))}
          </div>
          <div className="rooms__slots">
            {ROOM_SLOTS.map((slot) => {
              const state = slotState(slot);
              const selected = inSelection(slot);
              const selectable = canStartAt(slot);
              return (
                <button
                  key={slot}
                  type="button"
                  disabled={!selectable && !selected}
                  className={`rooms__slot rooms__slot--${state} ${selected ? 'is-selected' : ''}`}
                  onClick={() => setStart(selected && slot === start ? null : slot)}
                >
                  <strong>{slotLabel(slot, 2)}</strong>
                  <span>
                    {selected
                      ? '선택'
                      : { free: '예약 가능', taken: '예약 마감', mine: '내 예약', past: '지난 시간' }[state]}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="section-title">스터디 이름</h2>
          <input
            className="rooms__title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예) 면접 스터디"
            maxLength={20}
          />
          <div className="rooms__chips">
            {ROOM_TITLES.map((t) => (
              <button key={t} type="button" className="rooms__chip" onClick={() => setTitle(t)}>
                {t}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="section-title">사용할 이용권</h2>
          {passOptions.length ? (
            <div className="rooms__passes">
              {passOptions.map((p) => (
                <button
                  key={p.hours}
                  type="button"
                  className={`rooms__pass ${p.hours === passHours ? 'is-selected' : ''}`}
                  aria-pressed={p.hours === passHours}
                  onClick={() => setPassChoice(p.hours)}
                >
                  <FocusMark level={getPassLevel(p.hours)} size={26} strokeWidth={1.5} />
                  <span>{p.hours}H PASS</span>
                  <em>{passes[p.hours]}개 보유</em>
                </button>
              ))}
            </div>
          ) : (
            <div className="card rooms__no-pass">
              <p>{hours}H 이상 이용권이 없어요.</p>
              <Link to="/pass/buy" className="rooms__buy">
                이용권 구매하기
              </Link>
            </div>
          )}
          <p className="rooms__note">예약자 이용권 1장이 사용되고, 취소하면 돌아와요.</p>
        </section>

        <button type="button" className="btn btn--primary rooms__submit" disabled={!ready} onClick={book}>
          {start === null
            ? '시간을 선택해주세요'
            : `${room.name} · ${slotLabel(start, hours)} 예약하기`}
        </button>
      </div>
    </>
  );
}
