import { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import LastNotes from '../components/LastNotes.jsx';
import LastReview from '../components/LastReview.jsx';
import PageHeader from '../components/PageHeader.jsx';
import PlanSummary from '../components/PlanSummary.jsx';
import { useAppStore } from '../store/AppStore.jsx';
import './PlanSelect.css';

/** Matches the card's detail expand transition so the scroll lands on the final size. */
const EXPAND_DURATION = 300;

export default function PlanSelect() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { session, focus, plans } = useAppStore();
  const [shakeKey, setShakeKey] = useState(0);
  const selectedId = searchParams.get('plan');

  if (!session) return <Navigate to="/" replace />;
  if (focus) return <Navigate to="/focus" replace />;

  const select = (planId, card) => {
    setSearchParams({ plan: planId }, { replace: true });
    setTimeout(() => card.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), EXPAND_DURATION);
  };


  const loadSelected = () => {
    if (!selectedId) {
      setShakeKey((k) => k + 1);
      return;
    }
    navigate(`/focus/plan/${selectedId}/goals`);
  };

  return (
    <div className="plan-select">
      <PageHeader title="FOCUS" />
      <h2 className="plan-select__title">어떤 플랜으로 시작할까요?</h2>
      <p className="plan-select__lead">
        회원님의 계획에 맞게
        <br />
        <strong>원하는 플랜을 선택</strong>해서 시작해보세요.
      </p>
      <div className="plan-select__scroll">
        <LastReview />
        <LastNotes />

        {plans.length > 0 ? (
          <ul
            key={shakeKey}
            className={`plan-select__list ${shakeKey ? 'is-shaking' : ''}`}
            role="radiogroup"
            aria-label="플랜 선택"
          >
            {plans.map((plan, i) => {
              const selected = String(plan.id) === selectedId;
              return (
                <li key={plan.id} style={{ '--i': i }}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={`plan-select__card ${selected ? 'is-selected' : ''}`}
                    onClick={(e) => select(plan.id, e.currentTarget)}
                  >
                    <PlanSummary plan={plan} expanded={selected} />
                    <span className="plan-select__radio" aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="plan-select__empty">MY PLAN에 저장된 플랜이 없어요.</p>
        )}
      </div>

      <div className="plan-select__actions">
        {plans.length > 0 && (
          <button type="button" className="plan-select__primary" onClick={loadSelected}>
            선택한 플랜 불러오기
          </button>
        )}
        <button type="button" className="plan-select__skip" onClick={() => navigate('/focus/quick')}>
          플랜 없이 시작하기
        </button>
      </div>
    </div>
  );
}
