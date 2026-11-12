import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import FocusMark from '../../components/FocusMark.jsx';
import { HomeIcon } from '../../components/icons.jsx';
import { MEMBER_PASSES, PASS_TYPES, USER, formatWon, getPassLevel } from '../data.js';
import './PassSelect.css';

export default function PassSelect() {
  const navigate = useNavigate();
  const member = useLocation().state?.member ?? false;
  const [hours, setHours] = useState(PASS_TYPES[0].hours);

  const pass = PASS_TYPES.find((p) => p.hours === hours);
  const owned = member ? (MEMBER_PASSES[hours] ?? 0) : 0;
  const flow = { member, hours };

  return (
    <div className="k-pass">
      <header className="k-pass__top">
        <span className="k-pass__logo">FOCO</span>
        <Link to="/" className="k-pass__home" aria-label="처음으로">
          <HomeIcon size={36} />
        </Link>
      </header>

      <p className="k-pass__greeting">
        {member ? (
          <>
            안녕하세요, <em>{USER.name}</em> 님.
          </>
        ) : (
          '안녕하세요.'
        )}
        <br />
        사용할 PASS를 선택해주세요.
      </p>

      <div className="k-pass__grid" role="radiogroup" aria-label="PASS 선택">
        {PASS_TYPES.map((p) => (
          <button
            key={p.hours}
            type="button"
            role="radio"
            aria-checked={p.hours === hours}
            className={`k-pass__card ${p.hours === hours ? 'k-pass__card--active' : ''}`}
            onClick={() => setHours(p.hours)}
          >
            <span className="k-pass__hours">{p.hours}H</span>
            <span className="k-pass__name">{p.name}</span>
            <FocusMark
              className="k-pass__mark"
              level={getPassLevel(p.hours)}
              size={56}
              strokeWidth={2}
            />
          </button>
        ))}
      </div>

      <section className="k-pass__panel" key={hours}>
        <div className="k-pass__info">
          <p className="k-pass__panel-name">{pass.name}</p>
          {owned > 0 ? (
            <p>{owned}개 보유</p>
          ) : (
            <>
              <p>{member ? '구매한 이용권이 없습니다.' : '비회원 1회 이용권'}</p>
              <p>결제 금액: {formatWon(pass.price)}</p>
            </>
          )}
        </div>
        {owned > 0 ? (
          <button
            type="button"
            className="k-pass__action"
            onClick={() => navigate('/seat', { state: flow })}
          >
            사용하기
          </button>
        ) : (
          <button
            type="button"
            className="k-pass__action"
            onClick={() => navigate('/payment', { state: flow })}
          >
            구매하기
          </button>
        )}
      </section>
    </div>
  );
}
