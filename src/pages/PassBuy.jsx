import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import TossCheckout from '../components/TossCheckout.jsx';
import { PASS_TYPES, formatWon, useAppStore } from '../store/AppStore.jsx';
import './PassBuy.css';

const MAX_QTY = 9;
/** Distance between the expanded and collapsed sheet positions. */
const COLLAPSED_OFFSET = 320;
const DRAG_THRESHOLD = 60;

function StepIcon({ plus = false }) {
  return (
    <svg viewBox="0 0 30 30" fill="none" aria-hidden>
      <circle cx="15" cy="15" r="13.8" stroke="currentColor" />
      <path d="M6.5 15h17" stroke="currentColor" strokeWidth="1.9" />
      {plus && <path d="M15 6.5v17" stroke="currentColor" strokeWidth="1.9" />}
    </svg>
  );
}

export default function PassBuy() {
  const navigate = useNavigate();
  const location = useLocation();
  const { purchasePasses } = useAppStore();
  const [cart, setCart] = useState(() => location.state?.cart ?? {});
  const [expanded, setExpanded] = useState(false);
  const [dragY, setDragY] = useState(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const dragRef = useRef(null);

  const items = PASS_TYPES.filter((t) => cart[t.hours] > 0);
  const totalQty = items.reduce((sum, t) => sum + cart[t.hours], 0);
  const totalPrice = items.reduce((sum, t) => sum + cart[t.hours] * t.price, 0);
  const hasItems = totalQty > 0;
  const isExpanded = expanded && hasItems;

  const change = (hours, delta) => {
    const qty = Math.min(MAX_QTY, Math.max(0, (cart[hours] ?? 0) + delta));
    const next = { ...cart, [hours]: qty };
    setCart(next);
    if (Object.values(next).every((n) => n === 0)) setExpanded(false);
  };

  const onPointerDown = (e) => {
    if (e.target.closest('button')) return;
    dragRef.current = {
      startY: e.clientY,
      moved: false,
      onGrab: Boolean(e.target.closest('.pass-buy__grab')),
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dy = e.clientY - drag.startY;
    if (Math.abs(dy) > 4) drag.moved = true;
    if (drag.moved) setDragY(dy);
  };

  const onPointerUp = (e) => {
    const drag = dragRef.current;
    dragRef.current = null;
    setDragY(null);
    if (!drag) return;
    const dy = e.clientY - drag.startY;
    if (!drag.moved) {
      if (!isExpanded) setExpanded(true);
      else if (drag.onGrab) setExpanded(false);
      return;
    }
    if (isExpanded && dy > DRAG_THRESHOLD) setExpanded(false);
    else if (!isExpanded && dy < -DRAG_THRESHOLD) setExpanded(true);
  };

  let sheetY = !hasItems ? 'calc(100% + 24px)' : `${isExpanded ? 0 : COLLAPSED_OFFSET}px`;
  let dimOpacity = isExpanded ? 1 : 0;
  if (dragY !== null && hasItems) {
    const base = isExpanded ? 0 : COLLAPSED_OFFSET;
    const resisted = base + dragY < 0 ? (base + dragY) * 0.2 : base + dragY;
    sheetY = `${resisted}px`;
    dimOpacity = Math.min(1, Math.max(0, 1 - resisted / COLLAPSED_OFFSET));
  }

  const completePayment = () => {
    purchasePasses(Object.fromEntries(items.map((t) => [t.hours, cart[t.hours]])));
    navigate('/pass/done', { replace: true });
  };

  const orderName =
    items.length > 1 ? `이용권 ${items[0].hours}H 외 ${items.length - 1}건` : `이용권 ${items[0]?.hours}H`;

  return (
    <div className="pass-buy">
      <PageHeader title="이용권 추가 구매하기" />
      <p className="pass-buy__lead">
        <strong className={hasItems ? '' : 'is-highlight'}>이용시간</strong>을 선택해주세요.
      </p>

      <ul className="pass-buy__list">
        {PASS_TYPES.map((t, i) => {
          const qty = cart[t.hours] ?? 0;
          return (
            <li key={t.hours} className="pass-buy__row" style={{ '--i': i }}>
              <div>
                <p className="pass-buy__hours">{t.hours}H</p>
                <p className="pass-buy__price">{formatWon(t.price)}</p>
              </div>
              <div className="pass-buy__stepper">
                <button
                  type="button"
                  className={`pass-buy__step ${qty > 0 ? 'is-active' : ''}`}
                  onClick={() => change(t.hours, -1)}
                  disabled={qty === 0}
                  aria-label={`${t.hours}H 빼기`}
                >
                  <StepIcon />
                </button>
                <span key={qty} className={`pass-buy__qty ${qty > 0 ? 'is-active' : ''}`}>
                  {qty}
                </span>
                <button
                  type="button"
                  className={`pass-buy__step ${hasItems && qty < MAX_QTY ? 'is-active' : ''}`}
                  onClick={() => change(t.hours, 1)}
                  disabled={qty >= MAX_QTY}
                  aria-label={`${t.hours}H 추가`}
                >
                  <StepIcon plus />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <div
        className={`pass-buy__dim ${isExpanded ? 'is-visible' : ''} ${dragY !== null ? 'is-dragging' : ''}`}
        style={{ opacity: dimOpacity }}
        onClick={() => setExpanded(false)}
      />

      <section
        className={`pass-buy__sheet ${dragY !== null ? 'is-dragging' : ''}`}
        style={{ '--sheet-y': sheetY }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        aria-hidden={!hasItems}
        aria-label="담은 이용권"
      >
        <div className="pass-buy__grab">
          <span className="pass-buy__handle" />
        </div>
        <h2 className="pass-buy__sheet-title">
          담은 이용권 <strong key={totalQty}>{totalQty}</strong>
        </h2>
        <ul className="pass-buy__items">
          {items.map((t) => (
            <li key={t.hours}>
              <div>
                <p className="pass-buy__item-hours">{t.hours}H</p>
                <p className="pass-buy__item-qty">X{cart[t.hours]}</p>
              </div>
              <p className="pass-buy__item-price">{formatWon(t.price * cart[t.hours])}</p>
            </li>
          ))}
        </ul>
        <hr className="pass-buy__divider" />
        <div className="pass-buy__total">
          <span>최종 결제 금액</span>
          <strong>{formatWon(totalPrice)}</strong>
        </div>
        <button
          type="button"
          className={`pass-buy__pay ${isExpanded ? 'is-visible' : ''}`}
          onClick={() => setCheckoutOpen(true)}
          tabIndex={isExpanded ? 0 : -1}
        >
          결제하기
        </button>
      </section>

      {checkoutOpen && (
        <TossCheckout
          orderName={orderName}
          amount={totalPrice}
          onClose={() => setCheckoutOpen(false)}
          onComplete={completePayment}
        />
      )}
    </div>
  );
}
