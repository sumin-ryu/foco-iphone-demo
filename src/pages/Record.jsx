import { useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import FocusMark from '../components/FocusMark.jsx';
import { ChevronLeftIcon, ChevronRightIcon } from '../components/icons.jsx';
import TypeGlyph from '../components/TypeGlyph.jsx';
import { TODAY_KEY, formatHM, parseKey, toKey } from '../data/records.js';
import { summarizePattern } from '../data/pattern.js';
import { ROOM_HISTORY, roomOf, slotLabel } from '../data/rooms.js';
import { useRecords } from '../hooks/useRecords.js';
import './Record.css';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const SWIPE_THRESHOLD = 50;
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_KEY = /^\d{4}-\d{2}$/;

const toMonthKey = (year, month) => `${year}-${String(month + 1).padStart(2, '0')}`;

const latestRecordIn = (keys, year, month) =>
  keys.filter((key) => key.startsWith(toMonthKey(year, month))).at(-1) ?? null;

function buildMonth(year, month) {
  const offset = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const rows = Math.ceil((offset + days) / 7);
  return Array.from({ length: rows * 7 }, (_, i) => {
    const date = new Date(year, month, i - offset + 1);
    return { date, key: toKey(date), inMonth: date.getMonth() === month };
  });
}

/**
 * URL holds either `?date=YYYY-MM-DD` (a selected record) or `?month=YYYY-MM`
 * (a month without records), so returning from the detail page restores the view.
 */
function useCalendarParams(defaultDate) {
  const [params, setParams] = useSearchParams();
  const dateParam = params.get('date') ?? '';
  const monthParam = params.get('month') ?? '';

  let selectedKey = defaultDate;
  let viewDate = parseKey(defaultDate);
  if (DATE_KEY.test(dateParam)) {
    selectedKey = dateParam;
    viewDate = parseKey(dateParam);
  } else if (MONTH_KEY.test(monthParam)) {
    selectedKey = null;
    viewDate = parseKey(`${monthParam}-01`);
  }

  return {
    selectedKey,
    year: viewDate.getFullYear(),
    month: viewDate.getMonth(),
    setParams: (next) => setParams(next, { replace: true }),
  };
}

function SummaryTitle({ month, day }) {
  return (
    <h2 className="record-summary__title">
      {month}월{day ? ` ${day}일` : ''} <span>기록</span>
    </h2>
  );
}

function EmptySummary({ title, meta, message }) {
  return (
    <div className="record-summary record-summary--empty">
      {title}
      <p className="record-summary__meta">{meta}</p>
      <FocusMark level={4} size={90} strokeWidth={3} className="record-summary__mark" />
      <p className="record-summary__stats">{message}</p>
    </div>
  );
}

function RoomLine({ session }) {
  return (
    <p className="record-summary__room">
      {roomOf(session.roomId).name} · {session.title} · {slotLabel(session.start, session.hours)}
    </p>
  );
}

/**
 * Thin bar above the calendar into the month summary. Shows the month's type with its tag so
 * the name alone isn't left unexplained; one chevron for the whole card.
 */
function MonthEntry({ year, month, keys }) {
  const monthKey = toMonthKey(year, month);
  if (!latestRecordIn(keys, year, month)) return null;
  const pattern = summarizePattern(year, month);
  const type = pattern?.type;
  const inProgress =
    year === parseKey(TODAY_KEY).getFullYear() && month === parseKey(TODAY_KEY).getMonth();

  return (
    <Link to={`/record/month/${monthKey}`} className="record-month-entry">
      <span className="record-month-entry__label">
        {month + 1}월 요약
        {inProgress && <em>진행 중</em>}
      </span>
      {type ? (
        <span className="record-month-entry__type">
          <TypeGlyph type={type} size={16} />
          <strong>{type.name}</strong>
          <small>{type.tag}</small>
        </span>
      ) : (
        <span className="record-month-entry__hint">방문이 더 쌓이면 유형을 알려드려요</span>
      )}
      <ChevronRightIcon size={16} />
    </Link>
  );
}

function RecordSummary({ dateKey, record }) {
  const date = parseKey(dateKey);
  const title = <SummaryTitle month={date.getMonth() + 1} day={date.getDate()} />;

  if (!record) {
    return <EmptySummary title={title} meta="기록 없음" message="이 날은 집중한 기록이 없어요." />;
  }

  const passHours =
    record.visits.length > 1
      ? Math.max(...record.visits.map((v) => v.pass))
      : record.pass;

  return (
    <div className="record-summary">
      {title}
      <p className="record-summary__meta">
        {record.visits.length > 1 ? `${record.visits.length}회 방문` : `${record.pass}H PASS`} ·{' '}
        {record.startLabel} — {record.endLabel}
      </p>
      <FocusMark
        level={record.level}
        size={90}
        strokeWidth={3}
        animate
        className="record-summary__mark"
        passHours={passHours}
        focusMin={record.focus}
        restMin={record.rest}
        spendMode="ratio"
      />
      <p className="record-summary__legend" aria-hidden>
        <span className="record-summary__swatch record-summary__swatch--focus" />
        집중
        <span className="record-summary__swatch record-summary__swatch--rest" />
        휴식
        <span className="record-summary__swatch record-summary__swatch--idle" />
        남은 시간
      </p>
      <div className="record-summary__stats">
        <p>집중 {formatHM(record.focus)}</p>
        <p>휴식 {formatHM(record.rest)}</p>
        <p>{record.plans.join(' · ')}</p>
      </div>
      {ROOM_HISTORY[dateKey] && <RoomLine session={ROOM_HISTORY[dateKey]} />}
      <Link to={`/record/${dateKey}`} className="record-summary__more">
        상세보기
        <ChevronRightIcon size={16} />
      </Link>
    </div>
  );
}

export default function Record() {
  const { records, keys, defaultDate } = useRecords();
  const { selectedKey, year, month, setParams } = useCalendarParams(defaultDate);
  const [direction, setDirection] = useState(null);
  const swipeStartX = useRef(null);

  const today = parseKey(TODAY_KEY);
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
  const canGoNext = year < today.getFullYear() || (year === today.getFullYear() && month < today.getMonth());

  const cells = useMemo(() => buildMonth(year, month), [year, month]);
  const selectedIndex = cells.findIndex((c) => c.inMonth && c.key === selectedKey);

  const shiftMonth = (delta) => {
    if (delta > 0 && !canGoNext) return;
    const target = new Date(year, month + delta, 1);
    const latest = latestRecordIn(keys, target.getFullYear(), target.getMonth());
    setDirection(delta > 0 ? 'next' : 'prev');
    setParams(
      latest ? { date: latest } : { month: toMonthKey(target.getFullYear(), target.getMonth()) },
    );
  };

  const goToday = () => {
    if (!isCurrentMonth) setDirection('next');
    setParams({});
  };

  const onPointerDown = (e) => {
    swipeStartX.current = e.clientX;
  };

  const onPointerUp = (e) => {
    if (swipeStartX.current === null) return;
    const dx = e.clientX - swipeStartX.current;
    swipeStartX.current = null;
    if (Math.abs(dx) > SWIPE_THRESHOLD) shiftMonth(dx < 0 ? 1 : -1);
  };

  return (
    <div className="record">
      <div className="record__head">
        <h1 className="record__title">RECORD</h1>
        {selectedKey !== defaultDate && (
          <button type="button" className="record__today" onClick={goToday}>
            오늘
          </button>
        )}
      </div>

      <MonthEntry year={year} month={month} keys={keys} />

      <section className="calendar">
        <header className="calendar__header">
          <button
            type="button"
            className="calendar__nav"
            onClick={() => shiftMonth(-1)}
            aria-label="이전 달"
          >
            <ChevronLeftIcon size={20} />
          </button>
          <h2 key={toMonthKey(year, month)} className="calendar__month">
            {latestRecordIn(keys, year, month) ? (
              <Link
                to={`/record/month/${toMonthKey(year, month)}`}
                className="calendar__month-link"
                aria-label={`${month + 1}월 요약 보기`}
              >
                {year}년 {month + 1}월
                <ChevronRightIcon size={16} />
              </Link>
            ) : (
              `${year}년 ${month + 1}월`
            )}
          </h2>
          <button
            type="button"
            className="calendar__nav"
            onClick={() => shiftMonth(1)}
            disabled={!canGoNext}
            aria-label="다음 달"
          >
            <ChevronRightIcon size={20} />
          </button>
        </header>

        <div className="calendar__weekdays">
          {WEEKDAYS.map((w) => (
            <span key={w}>{w}</span>
          ))}
        </div>

        <div
          key={toMonthKey(year, month)}
          className={`calendar__grid ${direction ? `calendar__grid--${direction}` : ''}`}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (swipeStartX.current = null)}
        >
          {selectedIndex >= 0 && (
            <span
              className="calendar__highlight"
              style={{
                transform: `translate(${(selectedIndex % 7) * 100}%, ${
                  Math.floor(selectedIndex / 7) * 100
                }%)`,
              }}
            />
          )}
          {cells.map((cell, i) => {
            const record = cell.inMonth ? records[cell.key] : null;
            const isSelected = i === selectedIndex;
            const isToday = cell.key === TODAY_KEY;
            return (
              <button
                key={cell.key}
                type="button"
                className={[
                  'calendar__day',
                  !cell.inMonth && 'is-outside',
                  isToday && 'is-today',
                  isSelected && 'is-selected',
                ]
                  .filter(Boolean)
                  .join(' ')}
                disabled={!record}
                onClick={() => setParams({ date: cell.key })}
                aria-pressed={isSelected}
                aria-label={`${cell.date.getMonth() + 1}월 ${cell.date.getDate()}일${
                  isToday ? ' 오늘' : ''
                }${record ? `, 집중 ${formatHM(record.focus)}` : ''}`}
              >
                <span className="calendar__date">{cell.date.getDate()}</span>
                {record && (
                  <FocusMark
                    level={record.level}
                    size={25}
                    className="calendar__mark"
                    passHours={
                      record.visits.length > 1
                        ? Math.max(...record.visits.map((v) => v.pass))
                        : record.pass
                    }
                    focusMin={record.focus}
                    restMin={record.rest}
                    spendMode="ratio"
                  />
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="record__summary-card">
        {selectedKey ? (
          <RecordSummary key={selectedKey} dateKey={selectedKey} record={records[selectedKey]} />
        ) : (
          <EmptySummary
            key={toMonthKey(year, month)}
            title={<SummaryTitle month={month + 1} />}
            meta="기록 없음"
            message="이 달에는 집중한 기록이 없어요."
          />
        )}
      </section>
    </div>
  );
}
