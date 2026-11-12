import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import FocusMark from '../../components/FocusMark.jsx';
import { publishCheckIn } from '../../data/checkInBridge.js';
import {
  DEMO_CHECK_OUT,
  PASS_TYPES,
  USER,
  formatDuration,
  seatLabel,
  toClock,
  useAutoReturn,
} from '../data.js';
import './Complete.css';

const RETURN_SECONDS = 10;

function useCheckInSummary(flow) {
  const [now] = useState(() => new Date());
  const pass = PASS_TYPES.find((p) => p.hours === flow.hours) ?? PASS_TYPES[0];
  const end = new Date(now.getTime() + pass.hours * 3_600_000);

  // Tell the phone app the visit is ready (seat + pass chosen on this kiosk).
  useEffect(() => {
    if (!flow.member) return;
    publishCheckIn({
      seat: flow.seat ?? 'A12',
      passHours: pass.hours,
      member: true,
    });
  }, [flow.member, flow.seat, pass.hours]);

  return {
    title: '입실이 완료되었습니다.',
    message: flow.member ? `${USER.name} 님, 오늘도 좋은 집중 되세요.` : '오늘도 좋은 집중 되세요.',
    rows: [
      ['좌석', seatLabel(flow.seat ?? 'A12')],
      ['이용권', pass.name],
      ['이용 시간', `${toClock(now)} ~ ${toClock(end)}`],
    ],
    note: flow.member
      ? 'FOCO 앱에서 이용 정보를 확인할 수 있어요.'
      : '출력된 영수증을 챙겨주세요.',
  };
}

function useCheckOutSummary() {
  const [now] = useState(() => new Date());
  const start = new Date(now.getTime() - DEMO_CHECK_OUT.minutesUsed * 60_000);
  return {
    title: '퇴실이 완료되었습니다.',
    message: `${USER.name} 님, 오늘도 수고하셨어요.`,
    rows: [
      ['좌석', seatLabel(DEMO_CHECK_OUT.seat)],
      ['입실 · 퇴실', `${toClock(start)} ~ ${toClock(now)}`],
      ['이용 시간', formatDuration(DEMO_CHECK_OUT.minutesUsed)],
    ],
    note: '오늘의 기록은 FOCO 앱 RECORD에서 볼 수 있어요.',
  };
}

function CheckInComplete() {
  return <Summary {...useCheckInSummary(useLocation().state ?? {})} />;
}

function CheckOutComplete() {
  return <Summary {...useCheckOutSummary()} />;
}

function Summary({ title, message, rows, note }) {
  const navigate = useNavigate();
  const embed = new URLSearchParams(useLocation().search).get('embed') === '1';
  const left = useAutoReturn(embed ? null : RETURN_SECONDS);

  return (
    <div className="k-done">
      <FocusMark className="k-done__mark" level={4} size={104} strokeWidth={2.4} animate />
      <h1 className="k-done__title">{title}</h1>
      <p className="k-done__message">{message}</p>

      <dl className="k-done__card">
        {rows.map(([label, value]) => (
          <div key={label} className="k-done__row">
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p className="k-done__note">{note}</p>

      <button
        type="button"
        className="k-btn k-done__home"
        onClick={() => navigate('/', { replace: true })}
      >
        처음으로
      </button>
      {left != null && (
        <p className="k-done__countdown">{left}초 후 처음 화면으로 돌아갑니다.</p>
      )}
    </div>
  );
}

export default function Complete({ type }) {
  return type === 'check-out' ? <CheckOutComplete /> : <CheckInComplete />;
}
