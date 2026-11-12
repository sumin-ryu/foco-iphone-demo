import { Link, Navigate } from 'react-router-dom';
import { ArrowRightIcon, AsteriskIcon } from '../components/icons.jsx';
import { formatElapsed, useNow } from '../hooks/useNow.js';
import { memberName } from '../data/member.js';
import { seatLabel } from '../data/seats.js';
import { SEATS, getFocusElapsed, useAppStore } from '../store/AppStore.jsx';
import { isOnboarded } from './Onboarding.jsx';
import './Home.css';

const lines = (first, second) => (
  <>
    {first}
    <br />
    {second}
  </>
);

/** Renders a Link, or an inert block while the card is disabled. */
function Card({ to, disabled, className, style, children }) {
  const cls = `${className} ${disabled ? 'is-disabled' : ''}`;
  if (disabled) {
    return (
      <div className={cls} style={style} aria-disabled="true">
        {children}
      </div>
    );
  }
  return (
    <Link to={to} className={cls} style={style}>
      {children}
    </Link>
  );
}

function Tile({ title, description, index, variant = 'light', className = '', ...cardProps }) {
  return (
    <Card
      {...cardProps}
      className={`tile tile--${variant} ${className}`}
      style={{ '--i': index }}
    >
      <div className="tile__head">
        <span className="tile__title">{title}</span>
        <ArrowRightIcon className="tile__arrow" size={15.3} />
      </div>
      <p className="tile__desc">{description}</p>
    </Card>
  );
}

function MainTile() {
  const { session, focus } = useAppStore();
  const now = useNow(focus ? 1000 : 0);
  const common = { variant: 'dark', className: 'tile--tall', index: 3 };

  if (focus) {
    return (
      <Tile
        key="focusing"
        {...common}
        to="/focus"
        title={lines('FOCUSING', formatElapsed(getFocusElapsed(focus, now)))}
        description={lines('집중 기록으로', '돌아가기')}
      />
    );
  }

  if (session) {
    return (
      <Tile
        key="start"
        {...common}
        to="/focus/plan"
        title={lines('START', 'FOCUS')}
        description={lines('오늘도 집중을', '시작해보세요.')}
      />
    );
  }

  return (
    <Tile
      key="connect"
      {...common}
      to="/check-in"
      title={lines('CHECK-IN', 'CONNECT')}
      description={lines('체크인한 세션을', '연결해보세요.')}
    />
  );
}

export default function Home() {
  const { session, focus } = useAppStore();
  const isWaiting = Boolean(session && !focus);
  if (!isOnboarded()) return <Navigate to="/onboarding" replace />;

  return (
    <div className="home">
      <AsteriskIcon className="home__logo" size={49.6} />
      <h1 className="home__greeting" style={{ '--i': 1 }}>
        반갑습니다,
        <br />
        <span className="home__name">{memberName()}</span> 님.
      </h1>

      {session ? (
        <Card to="/check-out" className="seat-card seat-card--session" style={{ '--i': 2 }}>
          <span className="seat-card__action">
            퇴실하기
            <ArrowRightIcon size={13} />
          </span>
          <span className="seat-card__label">{seatLabel(session.seat)} 이용 중</span>
          <span className="seat-card__value">
            {session.startLabel} — {session.endLabel}
          </span>
        </Card>
      ) : (
        <Card to="/seats" className="seat-card" style={{ '--i': 2 }}>
          <span className="seat-card__label">좌석 현황</span>
          <span className="seat-card__value">
            {SEATS.occupied.length}/{SEATS.total}
          </span>
        </Card>
      )}

      <div className="home__grid">
        <MainTile />
        <Tile
          to="/plan"
          disabled={isWaiting}
          index={4}
          title="PLAN"
          description={lines('집중할 항목을', '설정해보세요.')}
        />
        <Tile
          to="/pass"
          disabled={isWaiting}
          index={5}
          className="tile--pass"
          title="PASS"
          description={lines('당신의 이용 시간을', '확인해보세요.')}
        />
      </div>
    </div>
  );
}
