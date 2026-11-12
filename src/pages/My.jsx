import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeftIcon } from '../components/icons.jsx';
import { formatPhone, getMember, memberName } from '../data/member.js';
import { useAppStore } from '../store/AppStore.jsx';
import './pages.css';
import './My.css';

const SERVICE_LINKS = [
  { to: '/pass', label: '이용권 관리' },
  { to: '/plan', label: '집중 플랜' },
  { to: '/seats', label: '좌석 현황' },
  { to: '/rooms', label: '스터디룸 예약' },
  { to: '/check-in', label: '체크인 세션' },
];

const SETTINGS_LINKS = [{ to: '/onboarding', label: '온보딩 다시 보기' }];

function LinkList({ links }) {
  return (
    <ul className="card list">
      {links.map(({ to, label }) => (
        <li key={to}>
          <Link to={to} className="list__item">
            <span>{label}</span>
            <ChevronLeftIcon size={18} className="my__chevron" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function My() {
  const [notify, setNotify] = useState(true);
  const member = getMember();
  const name = memberName();
  const { resetApp } = useAppStore();
  const [resetState, setResetState] = useState('idle');

  useEffect(() => {
    if (resetState === 'idle') return undefined;
    const id = setTimeout(() => setResetState('idle'), 3000);
    return () => clearTimeout(id);
  }, [resetState]);

  const reset = () => {
    if (resetState !== 'confirming') {
      setResetState('confirming');
      return;
    }
    resetApp();
    setResetState('done');
  };

  return (
    <div className="page page--tab">
      <h1 className="page__title">MY</h1>

      <div className="card my__profile">
        <span className="my__avatar">{name.slice(-2)}</span>
        <div>
          <p className="my__name">{name} 님</p>
          <p className="list__sub">{member ? formatPhone(member.phone) : 'foco@example.com'}</p>
        </div>
      </div>

      <h2 className="my__section">서비스</h2>
      <LinkList links={SERVICE_LINKS} />

      <h2 className="my__section">설정</h2>
      <LinkList links={SETTINGS_LINKS} />

      <ul className="card list">
        <li className="list__item">
          <span>알림 받기</span>
          <button
            type="button"
            role="switch"
            aria-checked={notify}
            className="my__switch"
            onClick={() => setNotify((v) => !v)}
          >
            <span />
          </button>
        </li>
        <li className="list__item">
          <span>앱 버전</span>
          <span className="list__sub">0.1.0 (demo)</span>
        </li>
        <li>
          <button
            type="button"
            className={`list__item my__reset ${resetState === 'confirming' ? 'is-confirming' : ''}`}
            onClick={reset}
          >
            <span>
              {resetState === 'confirming'
                ? '한 번 더 누르면 초기화돼요'
                : resetState === 'done'
                  ? '처음 상태로 되돌렸어요'
                  : '데모 처음 상태로 되돌리기'}
            </span>
          </button>
          <p className="my__reset-hint">직접 남긴 기록·메모, 바꾼 플랜과 이용권이 지워져요.</p>
        </li>
      </ul>
    </div>
  );
}
