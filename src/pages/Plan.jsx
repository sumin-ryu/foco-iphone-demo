import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useOutletContext } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import PlanSummary from '../components/PlanSummary.jsx';
import { MoreIcon, PlusIcon } from '../components/icons.jsx';
import { getPlanName, useAppStore } from '../store/AppStore.jsx';
import './Plan.css';

const REMOVE_DURATION = 280;
const HIGHLIGHT_DURATION = 1600;

function PlanCard({ plan, index, highlighted, onRemove }) {
  const ref = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const close = (e) => {
      if (!ref.current?.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [menuOpen]);

  useEffect(() => {
    if (highlighted) ref.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [highlighted]);

  const remove = () => {
    setMenuOpen(false);
    setRemoving(true);
    setTimeout(onRemove, REMOVE_DURATION);
  };

  return (
    <li
      ref={ref}
      className={['plan-card', removing && 'is-removing', highlighted && 'is-new']
        .filter(Boolean)
        .join(' ')}
      style={{ '--i': index }}
    >
      <div className="plan-card__inner">
        <button
          type="button"
          className="plan-card__main"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          <PlanSummary plan={plan} expanded={expanded} />
        </button>

        <button
          type="button"
          className="plan-card__more"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={`${getPlanName(plan)} 더보기`}
          aria-expanded={menuOpen}
        >
          <MoreIcon />
        </button>

        {menuOpen && (
          <div className="plan-card__menu" role="menu">
            <Link to={`/plan/${plan.id}/edit`} role="menuitem">
              수정하기
            </Link>
            <button type="button" role="menuitem" className="is-danger" onClick={remove}>
              삭제하기
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

export default function Plan() {
  const { plans, removePlan, highlightPlanId, clearHighlightPlan } = useAppStore();
  const { overlay } = useOutletContext() ?? {};

  useEffect(() => {
    if (!highlightPlanId) return undefined;
    const id = setTimeout(clearHighlightPlan, HIGHLIGHT_DURATION);
    return () => clearTimeout(id);
  }, [highlightPlanId, clearHighlightPlan]);

  return (
    <>
      <PageHeader title="PLAN" />
      <div className="plan-list">
        <h1 className="plan-list__title">MY PLAN</h1>
        <p className="plan-list__lead">
          다음 집중을 미리 <strong>계획해보세요.</strong>
          <br />
          집중할 항목과 목표 시간을 설정할 수 있어요.
        </p>

        {plans.length === 0 ? (
          <p className="plan-list__empty">아직 만든 플랜이 없어요.</p>
        ) : (
          <ul className="plan-list__items">
            {plans.map((plan, i) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                index={i}
                highlighted={plan.id === highlightPlanId}
                onRemove={() => removePlan(plan.id)}
              />
            ))}
          </ul>
        )}
      </div>

      {overlay &&
        createPortal(
          <Link to="/plan/new" className="plan-fab">
            <PlusIcon size={18} />새 플랜 만들기
          </Link>,
          overlay,
        )}
    </>
  );
}
