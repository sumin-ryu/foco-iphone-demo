import { getPlanName } from '../store/AppStore.jsx';
import './PlanSummary.css';

/** Weekday, memo and subject list shared by MY PLAN cards and the pre-focus plan picker. */
export default function PlanSummary({ plan, expanded = false }) {
  return (
    <>
      <p className="plan-card__name">
        {getPlanName(plan)} <span aria-hidden>{plan.emoji}</span>
      </p>
      <p className={`plan-card__memo ${plan.memo ? '' : 'is-empty'}`}>{plan.memo}</p>
      <p className="plan-card__subjects">
        {plan.subjects.map((s, i) => (
          <span key={s.id}>
            {i > 0 && <span className="plan-card__sep" aria-hidden />}
            {s.name}
          </span>
        ))}
      </p>
      <div className={`plan-card__detail ${expanded ? 'is-open' : ''}`}>
        <ul>
          {plan.subjects.map((s) => (
            <li key={s.id}>
              <span className="plan-card__detail-name">{s.name}</span>
              <span className="plan-card__detail-goal">{s.goal || '목표 없음'}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
