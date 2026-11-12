import { useEffect, useRef, useState } from 'react';
import { CheckIcon, CloseIcon } from './icons.jsx';
import { formatWon } from '../store/AppStore.jsx';
import './TossCheckout.css';

const METHODS = [
  { id: 'card', label: '신용·체크카드' },
  { id: 'tosspay', label: '토스페이' },
  { id: 'kakaopay', label: '카카오페이' },
  { id: 'naverpay', label: '네이버페이' },
  { id: 'transfer', label: '계좌이체' },
  { id: 'phone', label: '휴대폰' },
];

const CARD_COMPANIES = ['신한', '삼성', '현대', 'KB국민', '롯데', '하나', '우리', 'BC', 'NH농협'];

const CLOSE_DURATION = 300;
const PROCESS_DURATION = 1600;
const SUCCESS_DURATION = 1100;

/**
 * Demo-only stand-in for the Toss Payments checkout window. Nothing is charged;
 * `onComplete` fires after a fake processing step.
 */
export default function TossCheckout({ orderName, amount, onClose, onComplete }) {
  const [method, setMethod] = useState('card');
  const [company, setCompany] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [phase, setPhase] = useState('form');
  const [closing, setClosing] = useState(false);
  const timers = useRef([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));

  const methodLabel =
    method === 'card' ? `${company}카드` : METHODS.find((m) => m.id === method).label;

  let blocker = null;
  if (method === 'card' && !company) blocker = '카드사를 선택해주세요.';
  else if (!agreed) blocker = '필수 약관에 동의해주세요.';

  const close = () => {
    if (phase !== 'form' || closing) return;
    setClosing(true);
    later(onClose, CLOSE_DURATION);
  };

  const pay = () => {
    if (blocker) return;
    setPhase('processing');
    later(() => {
      navigator.vibrate?.(40);
      setPhase('success');
    }, PROCESS_DURATION);
    later(onComplete, PROCESS_DURATION + SUCCESS_DURATION);
  };

  return (
    <div className={`toss ${closing ? 'is-closing' : ''}`} role="dialog" aria-label="결제창">
      <header className="toss__header">
        <button type="button" className="toss__close" onClick={close} aria-label="결제 취소">
          <CloseIcon size={22} />
        </button>
        <p className="toss__brand">
          <strong>toss</strong> payments
        </p>
        <span className="toss__test">테스트</span>
      </header>

      <div className="toss__body">
        <section className="toss__order">
          <p className="toss__merchant">FOCO 스터디카페</p>
          <p className="toss__order-name">{orderName}</p>
          <p className="toss__amount">{formatWon(amount)}</p>
        </section>

        <section className="toss__section">
          <h2 className="toss__section-title">결제수단</h2>
          <div className="toss__methods" role="radiogroup" aria-label="결제수단">
            {METHODS.map((m) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={method === m.id}
                className={`toss__method ${method === m.id ? 'is-selected' : ''}`}
                onClick={() => setMethod(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>

          {method === 'card' && (
            <div className="toss__card-options">
              <p className="toss__label">카드사</p>
              <div className="toss__companies" role="radiogroup" aria-label="카드사">
                {CARD_COMPANIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={company === c}
                    className={`toss__company ${company === c ? 'is-selected' : ''}`}
                    onClick={() => setCompany(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <p className="toss__label">할부</p>
              <div className="toss__installment">
                <span>일시불</span>
                <span className="toss__installment-note">5만원 미만은 일시불만 가능해요</span>
              </div>
            </div>
          )}
        </section>

        <section className="toss__section">
          <button
            type="button"
            role="checkbox"
            aria-checked={agreed}
            className={`toss__agree ${agreed ? 'is-checked' : ''}`}
            onClick={() => setAgreed((v) => !v)}
          >
            <span className="toss__checkbox">
              <CheckIcon size={14} />
            </span>
            <span>
              <strong>[필수]</strong> 주문 내용을 확인했으며 결제에 동의합니다.
            </span>
          </button>
          <p className="toss__notice">시연용 테스트 결제로, 실제 금액이 청구되지 않아요.</p>
        </section>
      </div>

      <footer className="toss__footer">
        <p className={`toss__blocker ${blocker ? 'is-visible' : ''}`}>{blocker ?? ' '}</p>
        <button type="button" className="toss__pay" onClick={pay} disabled={Boolean(blocker)}>
          {formatWon(amount)} 결제하기
        </button>
      </footer>

      {phase !== 'form' && (
        <div className="toss__status" aria-live="polite">
          {phase === 'processing' ? (
            <>
              <span className="toss__spinner" />
              <p className="toss__status-title">결제를 진행하고 있어요</p>
              <p className="toss__status-sub">{methodLabel} · {formatWon(amount)}</p>
            </>
          ) : (
            <>
              <span className="toss__done">
                <CheckIcon size={34} />
              </span>
              <p className="toss__status-title">결제가 승인되었어요</p>
              <p className="toss__status-sub">{methodLabel} · {formatWon(amount)}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
