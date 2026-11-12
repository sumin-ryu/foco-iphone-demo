import { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import SubjectSuggest from '../components/SubjectSuggest.jsx';
import { PlusIcon } from '../components/icons.jsx';
import { pastSubjects, suggestSubjects } from '../data/subjects.js';
import { useRecords } from '../hooks/useRecords.js';
import { WEEKDAYS, getWeekdayIndex, useAppStore } from '../store/AppStore.jsx';
import './PlanNew.css';

let draftId = 0;
const emptySubject = () => ({ key: (draftId += 1), name: '', goal: '' });
const toDraft = (s) => ({ key: (draftId += 1), id: s.id, name: s.name, goal: s.goal });

export default function PlanNew() {
  const navigate = useNavigate();
  const { planId } = useParams();
  const draft = useLocation().state?.draft;
  const { plans, addPlan, updatePlan } = useAppStore();
  const editing = planId ? plans.find((p) => String(p.id) === planId) : null;
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState('forward');
  const [day, setDay] = useState(() => {
    if (editing) return editing.day;
    const last = plans.at(-1);
    return last ? (last.day + 1) % 7 : getWeekdayIndex();
  });
  const [memo, setMemo] = useState(() => editing?.memo ?? draft?.memo ?? '');
  const [subjects, setSubjects] = useState(() => {
    if (editing?.subjects.length) return editing.subjects.map(toDraft);
    if (draft?.subjects?.length) return draft.subjects.map(toDraft);
    return [emptySubject()];
  });
  const [shaking, setShaking] = useState(false);
  const [suggestKey, setSuggestKey] = useState(null);
  const { records } = useRecords();
  const [past] = useState(() => pastSubjects(plans, records));
  const focusKeyRef = useRef(null);
  const memoRef = useRef(null);
  const nameRefs = useRef(new Map());

  const filledSubjects = subjects.filter((s) => s.name.trim());
  const canProceed = step === 1 ? memo.trim().length > 0 : filledSubjects.length > 0;

  useEffect(() => {
    const key = focusKeyRef.current;
    if (key === null) return;
    focusKeyRef.current = null;
    const el = nameRefs.current.get(key);
    el?.focus({ preventScroll: true });
    el?.closest('.plan-new__subject')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [subjects]);

  const leave = () => {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate('/plan', { replace: true });
  };

  const goToStep = (next) => {
    setDirection(next > step ? 'forward' : 'back');
    setStep(next);
  };

  const rejectSubmit = () => {
    const target = step === 1 ? memoRef.current : nameRefs.current.get(subjects[0].key);
    target?.focus({ preventScroll: true });
    navigator.vibrate?.(30);
    setShaking(false);
    requestAnimationFrame(() => setShaking(true));
  };

  const submit = () => {
    if (!canProceed) {
      rejectSubmit();
      return;
    }
    if (step === 1) {
      goToStep(2);
      return;
    }
    const draft = {
      day,
      memo: memo.trim(),
      subjects: filledSubjects.map((s) => ({ id: s.id, name: s.name.trim(), goal: s.goal.trim() })),
    };
    if (editing) updatePlan(editing.id, draft);
    else addPlan(draft);
    leave();
  };

  const updateSubject = (key, field, value) =>
    setSubjects((prev) => prev.map((s) => (s.key === key ? { ...s, [field]: value } : s)));

  const addSubject = () => {
    const next = emptySubject();
    focusKeyRef.current = next.key;
    setSubjects((prev) => [...prev, next]);
  };

  const removeSubject = (key) => setSubjects((prev) => prev.filter((s) => s.key !== key));

  const pickSuggestion = (subject, picked) => {
    setSubjects((prev) =>
      prev.map((s) =>
        s.key === subject.key ? { ...s, name: picked.name, goal: s.goal || picked.goal } : s,
      ),
    );
    setSuggestKey(null);
  };

  const usedNames = new Set(subjects.map((s) => s.name.trim()));

  if (planId && !editing) return <Navigate to="/plan" replace />;

  return (
    <div className="plan-new">
      <PageHeader title={editing ? '플랜 수정하기' : '새 플랜 만들기'} onBack={() => (step === 2 ? goToStep(1) : leave())} />

      <div className="plan-new__body">
        <div key={step} className={`plan-new__step plan-new__step--${direction}`}>
          <div className="plan-new__intro">
            <p className="plan-new__step-no">Step.{step}</p>
            <h2 className="plan-new__step-title">{step === 1 ? '플랜명' : '과목 설정'}</h2>
          </div>

          {step === 1 ? (
            <form
              className="plan-new__intro"
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
            >
              <p className="plan-new__helper" id="plan-day-label">
                요일을 선택해주세요.
              </p>
              <div className="plan-new__days" role="radiogroup" aria-labelledby="plan-day-label">
                {WEEKDAYS.map((w, i) => (
                  <button
                    key={w}
                    type="button"
                    role="radio"
                    aria-checked={day === i}
                    aria-label={`${w}요일`}
                    className={`plan-new__day ${day === i ? 'is-selected' : ''}`}
                    onClick={() => setDay(i)}
                  >
                    {w}
                  </button>
                ))}
              </div>
              <label className="plan-new__helper plan-new__helper--memo" htmlFor="plan-memo">
                플랜 설명을 입력해주세요.
              </label>
              <input
                ref={memoRef}
                id="plan-memo"
                className={`plan-new__title-input ${shaking ? 'is-shaking' : ''}`}
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                onAnimationEnd={() => setShaking(false)}
                placeholder="예) 국어랑 영어 집중적으로 하기"
                maxLength={40}
                autoComplete="off"
              />
            </form>
          ) : (
            <>
              {subjects.map((s, i) => (
                <section key={s.key} className="plan-new__subject">
                  <div className="plan-new__subject-head">
                    <span>과목 {i + 1}</span>
                    {subjects.length > 1 && (
                      <button
                        type="button"
                        className="plan-new__subject-remove"
                        onClick={() => removeSubject(s.key)}
                      >
                        삭제
                      </button>
                    )}
                  </div>
                  <div
                    className={`plan-new__subject-card ${shaking && i === 0 ? 'is-shaking' : ''}`}
                    onAnimationEnd={(e) => e.target === e.currentTarget && setShaking(false)}
                  >
                    <label className="plan-new__subject-label" htmlFor={`name-${s.key}`}>
                      과목 이름을 입력해주세요.
                    </label>
                    <input
                      ref={(el) => {
                        if (el) nameRefs.current.set(s.key, el);
                        else nameRefs.current.delete(s.key);
                      }}
                      id={`name-${s.key}`}
                      className="plan-new__subject-name"
                      value={s.name}
                      onChange={(e) => {
                        updateSubject(s.key, 'name', e.target.value);
                        setSuggestKey(s.key);
                      }}
                      onFocus={() => setSuggestKey(s.key)}
                      maxLength={20}
                      autoComplete="off"
                    />
                    {suggestKey === s.key && (
                      <SubjectSuggest
                        items={suggestSubjects(past, s.name, usedNames)}
                        onPick={(picked) => pickSuggestion(s, picked)}
                      />
                    )}
                    <label className="plan-new__goal-label" htmlFor={`goal-${s.key}`}>
                      목표를 입력해주세요. (선택)
                    </label>
                    <input
                      id={`goal-${s.key}`}
                      className="plan-new__goal-input"
                      value={s.goal}
                      onChange={(e) => updateSubject(s.key, 'goal', e.target.value)}
                      onFocus={() => setSuggestKey(null)}
                      placeholder="예) 토익 800점 넘기기"
                      maxLength={40}
                      autoComplete="off"
                    />
                  </div>
                </section>
              ))}
              <button
                type="button"
                className="plan-new__add"
                onClick={addSubject}
                aria-label="과목 추가"
              >
                <PlusIcon size={20} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="plan-new__footer">
        <button type="button" className="plan-new__submit" onClick={submit}>
          {step === 1 ? '다음' : '저장하기'}
        </button>
      </div>
    </div>
  );
}
