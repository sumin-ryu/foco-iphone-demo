import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import FocusMark from '../components/FocusMark.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { PASS_TYPES, getPassLevel, useAppStore } from '../store/AppStore.jsx';
import './Pass.css';

const CARD_WIDTH = 301;
const CARD_GAP = 22;

export default function Pass() {
  const { passes } = useAppStore();
  const trackRef = useRef(null);
  const [active, setActive] = useState(0);

  const onScroll = (e) => {
    const index = Math.round(e.currentTarget.scrollLeft / (CARD_WIDTH + CARD_GAP));
    setActive(Math.min(PASS_TYPES.length - 1, Math.max(0, index)));
  };

  const scrollTo = (index) =>
    trackRef.current?.scrollTo({ left: index * (CARD_WIDTH + CARD_GAP), behavior: 'smooth' });

  return (
    <>
      <PageHeader title="PASS" />
      <div className="pass">
        <h1 className="pass__title">MY PASS</h1>
        <p className="pass__lead">
          <strong>이용권</strong>을 확인해보세요.
        </p>

        <div ref={trackRef} className="pass__track" onScroll={onScroll}>
          {PASS_TYPES.map((type, i) => (
            <article
              key={type.hours}
              className={`pass-card ${i === active ? 'is-active' : ''}`}
              style={{ '--card-color': type.color, '--i': i }}
              onClick={() => i !== active && scrollTo(i)}
            >
              <p className="pass-card__hours">{type.hours}H</p>
              <p className="pass-card__name">{type.name}</p>
              <FocusMark
                key={i === active ? 'active' : 'idle'}
                className="pass-card__mark"
                level={getPassLevel(type.hours)}
                size={88}
                strokeWidth={2.4}
                animate={i === active}
              />
              <p className="pass-card__bar">[{type.hours}-BAR]</p>
              <p className="pass-card__count">{passes[type.hours] ?? 0}개 소유 중</p>
            </article>
          ))}
        </div>

        <div className="pass__dots" role="tablist" aria-label="이용권 선택">
          {PASS_TYPES.map((type, i) => (
            <button
              key={type.hours}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`${type.hours}H 이용권`}
              className={`pass__dot ${i === active ? 'is-active' : ''}`}
              onClick={() => scrollTo(i)}
            />
          ))}
        </div>

        <Link to="/pass/buy" className="pass__buy">
          이용권 추가 구매하기
        </Link>
      </div>
    </>
  );
}
