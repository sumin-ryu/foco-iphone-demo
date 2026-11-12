import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import KioskHeader from '../components/KioskHeader.jsx';
import { CardIcon, PhoneIcon } from '../components/icons.jsx';
import { CheckIcon } from '../../components/icons.jsx';
import { PASS_TYPES, formatWon } from '../data.js';
import './Payment.css';

const METHODS = [
  {
    id: 'card',
    label: '신용·체크카드',
    Icon: CardIcon,
    guide: '카드를 아래 투입구에\n끝까지 꽂아주세요.',
  },
  {
    id: 'easy',
    label: '간편결제',
    Icon: PhoneIcon,
    guide: '결제 앱의 바코드를\n아래 스캐너에 대주세요.',
  },
];

/** No real terminal is attached, so approval is simulated after this delay (or on tap). */
const APPROVE_MS = 2600;
const DONE_HOLD_MS = 1000;
const DEFAULT_FLOW = { member: false, hours: PASS_TYPES[0].hours };

export default function Payment() {
  const navigate = useNavigate();
  const flow = useLocation().state ?? DEFAULT_FLOW;
  const pass = PASS_TYPES.find((p) => p.hours === flow.hours);

  const [method, setMethod] = useState(null);
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    if (!method) return undefined;
    if (approved) {
      const id = setTimeout(
        () => navigate('/seat', { replace: true, state: { ...flow, paid: true } }),
        DONE_HOLD_MS,
      );
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => setApproved(true), APPROVE_MS);
    return () => clearTimeout(id);
  }, [method, approved, flow, navigate]);

  const selected = METHODS.find((m) => m.id === method);

  return (
    <>
      <KioskHeader title="결제" onBack={method ? () => setMethod(null) : undefined} />
      <div className="k-pay">
        <div className="k-pay__summary">
          <div>
            <p className="k-pay__pass">{pass.name}</p>
            <p className="k-pay__desc">{pass.hours}시간 이용권 · 1매</p>
          </div>
          <p className="k-pay__price">{formatWon(pass.price)}</p>
        </div>

        {!selected ? (
          <>
            <p className="k-pay__label">결제 수단을 선택해주세요.</p>
            <div className="k-pay__methods">
              {METHODS.map(({ id, label, Icon }) => (
                <button key={id} type="button" className="k-pay__method" onClick={() => setMethod(id)}>
                  <Icon size={56} />
                  {label}
                </button>
              ))}
            </div>
          </>
        ) : (
          <button
            type="button"
            className="k-pay__waiting"
            onClick={() => setApproved(true)}
            disabled={approved}
          >
            {approved ? (
              <>
                <span className="k-pay__done">
                  <CheckIcon size={40} />
                </span>
                <span className="k-pay__guide">결제가 완료되었습니다.</span>
              </>
            ) : (
              <>
                <span className="k-pay__pulse">
                  <selected.Icon size={64} />
                </span>
                <span className="k-pay__guide">{selected.guide}</span>
                <span className="k-pay__sub">결제 승인을 기다리는 중…</span>
              </>
            )}
          </button>
        )}
      </div>
    </>
  );
}
