import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import FocusMark from '../components/FocusMark.jsx';
import { ChevronLeftIcon } from '../components/icons.jsx';
import { ITEM_COLORS } from '../data/focusColors.js';
import { formatPhone } from '../data/member.js';
import { useStatusBarTheme } from '../hooks/useStatusBarTheme.js';
import KioskFrame, { DEVICE_HEIGHT, DEVICE_WIDTH } from '../kiosk/components/KioskFrame.jsx';
import KioskQrView, { MEMBER_CHECK_IN } from '../kiosk/components/KioskQrView.jsx';
import { PASS_TYPES, getPassLevel } from '../store/AppStore.jsx';
import Signup from './Signup.jsx';
import './Focus.css';
import './Onboarding.css';

const ONBOARDED_KEY = 'foco-onboarded';
export const isOnboarded = () => localStorage.getItem(ONBOARDED_KEY) === '1';
export const markOnboarded = () => localStorage.setItem(ONBOARDED_KEY, '1');

const INTRO = ['pass', 'kiosk', 'focus'];
const SWIPE_THRESHOLD = 50;

const KIOSK_SCALE = 0.26;
/** Center of the kiosk's QR code, in unscaled device px from the top of the device. */
const QR_CENTER_Y = 473;

function PassVisual() {
  return (
    <div className="onboarding__passes" aria-hidden>
      {PASS_TYPES.map((p, i) => (
        <div key={p.hours} className="onboarding__pass" style={{ '--i': i }}>
          <FocusMark level={getPassLevel(p.hours)} size={52} strokeWidth={2} animate />
          <span>{p.hours}H</span>
        </div>
      ))}
    </div>
  );
}

function KioskVisual() {
  const [scanned, setScanned] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setScanned(true), 1600);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="onboarding__kiosk" aria-hidden>
      <div
        className="onboarding__kiosk-device"
        style={{ width: DEVICE_WIDTH * KIOSK_SCALE, height: DEVICE_HEIGHT * KIOSK_SCALE }}
      >
        <KioskFrame enabled scale={KIOSK_SCALE}>
          <KioskQrView label={MEMBER_CHECK_IN.label} hint={MEMBER_CHECK_IN.hint} scanned={scanned} />
        </KioskFrame>
        <span
          className={`onboarding__scan ${scanned ? 'is-scanned' : ''}`}
          style={{ top: QR_CENTER_Y * KIOSK_SCALE }}
        />
      </div>
    </div>
  );
}

const DEMO_BAR = [
  { from: 0, to: 0.38, color: ITEM_COLORS[0] },
  { from: 0.38, to: 0.46, color: '#6e6e6e' },
  { from: 0.46, to: 0.7, color: ITEM_COLORS[1], active: true },
];

function FocusVisual() {
  return (
    <div className="onboarding__focus" aria-hidden>
      <p className="onboarding__focus-label">1H BAR</p>
      <p className="onboarding__focus-timer">42:00</p>
      <div className="focus__bar onboarding__bar">
        <span className="focus__ray focus__ray--up" />
        <span className="focus__ray focus__ray--down" />
        {DEMO_BAR.map((s, i) => (
          <span
            key={i}
            className={`focus__bar-fill onboarding__bar-fill ${s.active ? 'is-active' : ''}`}
            style={{
              left: `${s.from * 100}%`,
              width: `${(s.to - s.from) * 100}%`,
              '--item-color': s.color,
              '--i': i,
            }}
          />
        ))}
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} className="focus__bar-tick" style={{ left: `${i * 20}%` }} />
        ))}
      </div>
      <div className="onboarding__week">
        {[2, 0, 4, 1, 0, 3, 2].map((level, i) => (
          <span key={i} style={{ '--i': i }}>
            <FocusMark level={level} size={22} />
            <em>{['일', '월', '화', '수', '목', '금', '토'][i]}</em>
          </span>
        ))}
      </div>
    </div>
  );
}

const GUIDE_STEPS = [
  { title: '요일과 설명 정하기', body: 'MY PLAN에서 +를 눌러 요일별 플랜을 만들어요.' },
  { title: '과목과 큰 목표 넣기', body: '과목마다 길게 보는 목표를 적어둘 수 있어요.' },
  {
    title: '집중할 때 오늘의 세부 목표 적기',
    body: '체크인 후 플랜을 고르고 오늘 할 일을 적어요.\n플랜 없이 즉흥 플랜으로 시작해도 돼요.',
  },
];

/** A plan card as it appears in MY PLAN, with the three parts the guide walks through. */
function PlanMock() {
  return (
    <div className="plan-mock" aria-hidden>
      <div className="plan-mock__card">
        <p className="plan-mock__name">
          <i>1</i>월요일 🔥
        </p>
        <p className="plan-mock__memo">국어랑 영어 집중적으로 하기</p>
        <div className="plan-mock__subject">
          <i>2</i>
          <strong>영어</strong>
          <span>영단어 3000개 마스터</span>
        </div>
      </div>
      <div className="plan-mock__tasks">
        <i>3</i>
        <p>
          <span className="plan-mock__box" />
          단어 Day 12
        </p>
        <p>
          <span className="plan-mock__box" />
          독해 2지문
        </p>
      </div>
    </div>
  );
}

const INTRO_COPY = {
  pass: {
    title: ['이용권만큼,', '온전히 내 시간'],
    body: `${PASS_TYPES.map((p) => p.hours).join(' · ')}시간 이용권은 최대 이용 시간이에요.\n그 안에서 집중과 휴식이 그대로 기록돼요.`,
    Visual: PassVisual,
  },
  kiosk: {
    title: ['키오스크에서 체크인하고', '앱으로 연결해요'],
    body: '좌석과 이용권은 키오스크에서 고르고,\n앱으로 QR을 스캔하면 바로 집중을 시작해요.',
    Visual: KioskVisual,
  },
  focus: {
    title: ['1시간 바로 집중을 쌓고', '기록으로 다음을 계획해요'],
    body: '과목을 바꾸거나 쉬어도 바 하나에 담기고,\n한 달 요약이 다음 이용권과 플랜을 제안해줘요.',
    Visual: FocusVisual,
  },
};

/** Optional `?step=` jump for demos (e.g. done). */
function trailForStep(step) {
  if (step === 'done') return ['pass', 'account', 'guide', 'done'];
  if (step === 'account') return ['pass', 'account'];
  if (step === 'guide') return ['pass', 'account', 'guide'];
  const i = INTRO.indexOf(step);
  if (i <= 0) return ['pass'];
  return INTRO.slice(0, i + 1);
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  /** Steps visited so far; going back pops the last one. */
  const [trail, setTrail] = useState(() => trailForStep(searchParams.get('step')));
  const [direction, setDirection] = useState('forward');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const swipeStartX = useRef(null);
  useStatusBarTheme('light');

  const name = trail.at(-1);
  const introIndex = INTRO.indexOf(name);
  const isIntro = introIndex !== -1;

  const go = (next) => {
    setDirection('forward');
    setTrail((t) => [...t, next]);
  };
  const back = () => {
    setDirection('back');
    setTrail((t) => (t.length > 1 ? t.slice(0, -1) : t));
  };
  const nextIntro = () => go(INTRO[introIndex + 1] ?? 'account');

  const finish = (to) => {
    markOnboarded();
    navigate(to, { replace: true });
  };

  const onPointerDown = (e) => {
    swipeStartX.current = isIntro ? e.clientX : null;
  };
  const onPointerUp = (e) => {
    if (swipeStartX.current === null) return;
    const dx = e.clientX - swipeStartX.current;
    swipeStartX.current = null;
    if (dx < -SWIPE_THRESHOLD) nextIntro();
    else if (dx > SWIPE_THRESHOLD && trail.length > 1) back();
  };

  if (name === 'signup') {
    return (
      <div className="onboarding">
        <Signup onBack={back} onDone={() => go('guide')} />
      </div>
    );
  }

  const skip = isIntro
    ? ['건너뛰기', () => go('account')]
    : name === 'guide'
      ? ['건너뛰기', () => go('done')]
      : null;

  const phoneDigits = phone.replace(/\D/g, '');
  const footer = {
    pass: { label: '다음', onClick: nextIntro },
    kiosk: { label: '다음', onClick: nextIntro },
    focus: { label: '다음', onClick: nextIntro },
    login: {
      label: '로그인',
      onClick: () => go('guide'),
      disabled: phoneDigits.length !== 11 || password.length < 4,
    },
    guide: { label: '다음', onClick: () => go('done') },
  }[name];

  const renderBody = () => {
    if (isIntro) {
      const { title, body, Visual } = INTRO_COPY[name];
      return (
        <>
          <div className="onboarding__visual">
            <Visual />
          </div>
          <h2 className="onboarding__title">
            {title[0]}
            <br />
            {title[1]}
          </h2>
          <p className="onboarding__body">{body}</p>
        </>
      );
    }

    if (name === 'account') {
      return (
        <div className="onboarding__account">
          <FocusMark level={4} size={72} strokeWidth={2.4} animate />
          <h2 className="onboarding__title">
            FOCO 회원으로
            <br />
            시작해볼까요?
          </h2>
          <p className="onboarding__body">
            회원이면 키오스크에서 바로 체크인하고
            <br />
            집중 기록이 계정에 쌓여요.
          </p>
        </div>
      );
    }

    if (name === 'login') {
      return (
        <div className="onboarding__form">
          <h2 className="onboarding__title">로그인</h2>
          <p className="onboarding__body">가입할 때 쓴 휴대폰 번호로 로그인해요.</p>
          <label className="onboarding__field">
            <span>휴대폰 번호</span>
            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value.replace(/\D/g, '')))}
              placeholder="010-0000-0000"
              autoComplete="tel"
            />
          </label>
          <label className="onboarding__field onboarding__field--next">
            <span>비밀번호</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <em>데모에서는 아무 비밀번호나 입력하면 돼요.</em>
          </label>
          <button type="button" className="onboarding__link" onClick={() => go('signup')}>
            아직 회원이 아니에요 · <strong>회원가입</strong>
          </button>
        </div>
      );
    }

    if (name === 'guide') {
      return (
        <div className="onboarding__form">
          <h2 className="onboarding__title">
            플랜은
            <br />
            이렇게 만들어요
          </h2>
          <PlanMock />
          <ol className="onboarding__guide">
            {GUIDE_STEPS.map((g, i) => (
              <li key={g.title} style={{ '--i': i }}>
                <i>{i + 1}</i>
                <div>
                  <strong>{g.title}</strong>
                  <p>{g.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      );
    }

    return (
      <div className="onboarding__done">
        <FocusMark level={4} size={96} strokeWidth={3} animate />
        <h2 className="onboarding__title">준비가 끝났어요</h2>
        <p className="onboarding__body">
          첫 플랜을 만들어두면
          <br />
          체크인하고 바로 집중을 시작할 수 있어요.
        </p>
      </div>
    );
  };

  return (
    <div className="onboarding" onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
      <header className="onboarding__header">
        {trail.length > 1 && name !== 'done' ? (
          <button type="button" className="onboarding__icon-btn" onClick={back} aria-label="이전">
            <ChevronLeftIcon />
          </button>
        ) : (
          <span className="onboarding__icon-btn" />
        )}
        {isIntro && (
          <div className="onboarding__dots" aria-label={`${introIndex + 1} / ${INTRO.length}`}>
            {INTRO.map((s, i) => (
              <span key={s} className={i === introIndex ? 'is-active' : ''} />
            ))}
          </div>
        )}
        {skip ? (
          <button type="button" className="onboarding__skip" onClick={skip[1]}>
            {skip[0]}
          </button>
        ) : (
          <span className="onboarding__icon-btn" />
        )}
      </header>

      <div key={name} className={`onboarding__step onboarding__step--${direction}`}>
        {renderBody()}
      </div>

      <div className="onboarding__footer">
        {name === 'account' && (
          <>
            <button type="button" className="onboarding__primary" onClick={() => go('signup')}>
              회원가입
            </button>
            <button type="button" className="onboarding__outline" onClick={() => go('login')}>
              이미 회원이에요
            </button>
            <button type="button" className="onboarding__secondary" onClick={() => go('guide')}>
              비회원으로 둘러보기
            </button>
          </>
        )}
        {name === 'done' && (
          <>
            <button type="button" className="onboarding__primary" onClick={() => finish('/plan/new')}>
              첫 플랜 만들기
            </button>
            <button type="button" className="onboarding__secondary" onClick={() => finish('/')}>
              홈 둘러보기
            </button>
          </>
        )}
        {footer && (
          <button
            type="button"
            className="onboarding__primary"
            onClick={footer.onClick}
            disabled={footer.disabled}
          >
            {footer.label}
          </button>
        )}
      </div>
    </div>
  );
}
