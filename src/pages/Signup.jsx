import { useEffect, useRef, useState } from 'react';
import { CheckIcon, ChevronLeftIcon } from '../components/icons.jsx';
import { formatPhone, saveMember } from '../data/member.js';
import './Onboarding.css';
import './Signup.css';

const TERMS = [
  { id: 'service', label: '이용약관 동의', required: true },
  { id: 'privacy', label: '개인정보 수집 · 이용 동의', required: true },
  { id: 'age', label: '만 14세 이상이에요', required: true },
  { id: 'marketing', label: '이벤트 · 혜택 알림 받기', required: false },
];
const STEPS = ['terms', 'profile', 'password', 'welcome'];
const PASSWORD_RULES = [
  { label: '8자 이상', test: (pw) => pw.length >= 8 },
  { label: '영문 포함', test: (pw) => /[a-z]/i.test(pw) },
  { label: '숫자 포함', test: (pw) => /\d/.test(pw) },
];

function Check({ checked }) {
  return (
    <span className={`signup__check ${checked ? 'is-checked' : ''}`} aria-hidden>
      {checked && <CheckIcon size={13} />}
    </span>
  );
}

/**
 * Study cafe membership sign-up: terms, name and phone verification, password. The same
 * account checks in at the kiosk. Calls `onDone(member)` after the welcome screen.
 */
export default function Signup({ onBack, onDone }) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState('forward');
  const [agreed, setAgreed] = useState({});
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const codeRef = useRef(null);

  const current = STEPS[step];
  const phoneDigits = phone.replace(/\D/g, '');
  const allAgreed = TERMS.every((t) => agreed[t.id]);
  const requiredAgreed = TERMS.filter((t) => t.required).every((t) => agreed[t.id]);
  const passwordOk = PASSWORD_RULES.every((r) => r.test(password));
  const member = { name: name.trim(), phone: phoneDigits, marketing: Boolean(agreed.marketing) };

  useEffect(() => {
    if (codeSent) codeRef.current?.focus();
  }, [codeSent]);

  const goTo = (next) => {
    setDirection(next > step ? 'forward' : 'back');
    setStep(next);
  };

  const back = () => (step === 0 ? onBack() : goTo(step - 1));

  const complete = () => {
    saveMember(member);
    goTo(STEPS.indexOf('welcome'));
  };

  const footer = {
    terms: { label: '동의하고 계속하기', onClick: () => goTo(1), disabled: !requiredAgreed },
    profile: codeSent
      ? { label: '인증 완료', onClick: () => goTo(2), disabled: code.length !== 6 || !name.trim() }
      : {
          label: '인증번호 받기',
          onClick: () => setCodeSent(true),
          disabled: phoneDigits.length !== 11 || !name.trim(),
        },
    password: {
      label: '가입하기',
      onClick: complete,
      disabled: !passwordOk || password !== confirm,
    },
    welcome: { label: '계속하기', onClick: () => onDone(member) },
  }[current];

  const renderBody = () => {
    if (current === 'terms') {
      return (
        <>
          <h2 className="onboarding__title">
            FOCO 스터디카페
            <br />
            회원가입
          </h2>
          <p className="onboarding__body">약관에 동의하면 가입을 시작할게요.</p>
          <button
            type="button"
            className="signup__all"
            aria-pressed={allAgreed}
            onClick={() =>
              setAgreed(allAgreed ? {} : Object.fromEntries(TERMS.map((t) => [t.id, true])))
            }
          >
            <Check checked={allAgreed} />
            전체 동의하기
          </button>
          <ul className="signup__terms">
            {TERMS.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  className="signup__term"
                  aria-pressed={Boolean(agreed[t.id])}
                  onClick={() => setAgreed((a) => ({ ...a, [t.id]: !a[t.id] }))}
                >
                  <Check checked={Boolean(agreed[t.id])} />
                  <span className={t.required ? 'is-required' : ''}>
                    {t.required ? '[필수]' : '[선택]'}
                  </span>
                  {t.label}
                </button>
              </li>
            ))}
          </ul>
        </>
      );
    }

    if (current === 'profile') {
      return (
        <>
          <h2 className="onboarding__title">
            이름과 휴대폰 번호를
            <br />
            알려주세요
          </h2>
          <p className="onboarding__body">키오스크에서 회원 체크인할 때 쓰여요.</p>
          <label className="onboarding__field">
            <span>이름</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              maxLength={20}
              autoComplete="name"
            />
          </label>
          <label className="onboarding__field signup__field">
            <span>휴대폰 번호</span>
            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => {
                setPhone(formatPhone(e.target.value.replace(/\D/g, '')));
                setCodeSent(false);
                setCode('');
              }}
              placeholder="010-0000-0000"
              autoComplete="tel"
            />
          </label>
          {codeSent && (
            <label className="onboarding__field onboarding__field--code signup__field">
              <span>인증번호</span>
              <input
                ref={codeRef}
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6자리 숫자"
                autoComplete="one-time-code"
              />
              <em>데모에서는 아무 숫자 6자리를 입력하면 돼요.</em>
            </label>
          )}
        </>
      );
    }

    if (current === 'password') {
      return (
        <>
          <h2 className="onboarding__title">
            비밀번호를
            <br />
            설정해주세요
          </h2>
          <p className="onboarding__body">앱에 로그인할 때 사용해요.</p>
          <label className="onboarding__field">
            <span>비밀번호</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </label>
          <ul className="signup__rules">
            {PASSWORD_RULES.map((r) => (
              <li key={r.label} className={r.test(password) ? 'is-ok' : ''}>
                <CheckIcon size={12} />
                {r.label}
              </li>
            ))}
          </ul>
          <label className="onboarding__field signup__field">
            <span>비밀번호 확인</span>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
            {confirm && password !== confirm && <em className="signup__error">비밀번호가 달라요.</em>}
          </label>
        </>
      );
    }

    return (
      <div className="signup__welcome">
        <span className="signup__welcome-badge">
          <CheckIcon size={30} />
        </span>
        <h2 className="onboarding__title">
          {member.name} 님,
          <br />
          가입을 환영해요
        </h2>
        <p className="onboarding__body">
          이제 키오스크에서 회원으로 체크인하고
          <br />
          앱에 집중 기록을 남길 수 있어요.
        </p>
      </div>
    );
  };

  return (
    <>
      <header className="onboarding__header">
        {current === 'welcome' ? (
          <span className="onboarding__icon-btn" />
        ) : (
          <button type="button" className="onboarding__icon-btn" onClick={back} aria-label="이전">
            <ChevronLeftIcon />
          </button>
        )}
        {current !== 'welcome' && (
          <p className="signup__progress">
            {step + 1} / {STEPS.length - 1}
          </p>
        )}
        <span className="onboarding__icon-btn" />
      </header>

      <div key={current} className={`onboarding__step onboarding__step--${direction}`}>
        {current === 'welcome' ? (
          renderBody()
        ) : (
          <div className="onboarding__form">{renderBody()}</div>
        )}
      </div>

      <div className="onboarding__footer">
        <button
          type="button"
          className="onboarding__primary"
          onClick={footer.onClick}
          disabled={footer.disabled}
        >
          {footer.label}
        </button>
      </div>
    </>
  );
}
