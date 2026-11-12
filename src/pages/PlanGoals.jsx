import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import SubjectSuggest from '../components/SubjectSuggest.jsx';
import { CloseIcon, PlusIcon } from '../components/icons.jsx';
import { subjectKey } from '../data/subjects.js';
import { useLastReview } from '../hooks/useLastReview.js';
import { getPlanName, useAppStore } from '../store/AppStore.jsx';
import './PlanGoals.css';

let draftId = 0;
const emptyTask = () => ({ key: (draftId += 1), text: '' });

export default function PlanGoals() {
  const navigate = useNavigate();
  const { planId } = useParams();
  const { session, focus, plans, startFocus } = useAppStore();
  const { startWith, unfinished } = useLastReview();
  const plan = plans.find((p) => String(p.id) === planId);
  const [tasks, setTasks] = useState(() =>
    Object.fromEntries((plan?.subjects ?? []).map((s) => [s.id, [emptyTask()]])),
  );
  const inputRefs = useRef(new Map());
  const focusKeyRef = useRef(null);

  useEffect(() => {
    if (focusKeyRef.current == null) return;
    inputRefs.current.get(focusKeyRef.current)?.focus();
    focusKeyRef.current = null;
  }, [tasks]);

  if (!session) return <Navigate to="/" replace />;
  if (focus) return <Navigate to="/focus" replace />;
  if (!plan) return <Navigate to="/focus/plan" replace />;

  const updateTask = (subjectId, key, text) =>
    setTasks((all) => ({
      ...all,
      [subjectId]: all[subjectId].map((t) => (t.key === key ? { ...t, text } : t)),
    }));

  const addTask = (subjectId, afterKey) => {
    const task = emptyTask();
    focusKeyRef.current = task.key;
    setTasks((all) => {
      const list = [...all[subjectId]];
      const at = afterKey == null ? list.length : list.findIndex((t) => t.key === afterKey) + 1;
      list.splice(at, 0, task);
      return { ...all, [subjectId]: list };
    });
  };

  const removeTask = (subjectId, key) =>
    setTasks((all) => ({ ...all, [subjectId]: all[subjectId].filter((t) => t.key !== key) }));

  /** Goals the last visit left unfinished, for this subject and not added yet. */
  const carriedFor = (s) =>
    unfinished
      .filter((c) => subjectKey(c.subject) === subjectKey(s.name))
      .filter((c) => !tasks[s.id].some((t) => t.text.trim() === c.label))
      .map((c) => ({ name: c.label }));

  /** Fills the first empty row with `text`, or adds a row for it. */
  const addCarried = (subjectId, text) =>
    setTasks((all) => {
      const list = all[subjectId];
      const blank = list.find((t) => !t.text.trim());
      return {
        ...all,
        [subjectId]: blank
          ? list.map((t) => (t === blank ? { ...t, text } : t))
          : [...list, { ...emptyTask(), text }],
      };
    });

  /** Enter on a filled row opens a new row below; on an empty row it jumps to the next subject. */
  const onKeyDown = (e, subjectIndex, task) => {
    if (e.key !== 'Enter' || e.nativeEvent.isComposing) return;
    e.preventDefault();
    const subjectId = plan.subjects[subjectIndex].id;
    if (task.text.trim()) {
      addTask(subjectId, task.key);
      return;
    }
    const next = plan.subjects[subjectIndex + 1];
    const nextKey = next && tasks[next.id][0]?.key;
    if (nextKey != null) inputRefs.current.get(nextKey)?.focus();
    else e.currentTarget.blur();
  };

  const begin = () => {
    startFocus(
      plan.id,
      Object.fromEntries(
        plan.subjects.map((s) => [
          s.id,
          tasks[s.id].map((t) => t.text.trim()).filter(Boolean),
        ]),
      ),
      startWith,
    );
    navigate('/focus', { replace: true });
  };

  return (
    <div className="plan-goals">
      <PageHeader title={getPlanName(plan)} />

      <div className="plan-goals__body">
        <h2 className="plan-goals__title">오늘의 목표는 무엇인가요?</h2>
        <p className="plan-goals__lead">
          MY PLAN의 목표를 이루기 위해
          <br />
          오늘 할 <strong>세부 목표</strong>를 과목별로 추가해보세요.
        </p>

        <ul className="plan-goals__list">
          {plan.subjects.map((s, si) => (
            <li key={s.id} className="plan-goals__card" style={{ '--i': si }}>
              <p className="plan-goals__name">{s.name}</p>
              {s.goal && (
                <p className="plan-goals__big">
                  <span className="plan-goals__big-label">큰 목표</span>
                  {s.goal}
                </p>
              )}

              <ul className="plan-goals__tasks">
                {tasks[s.id].map((t) => (
                  <li key={t.key} className="plan-goals__task">
                    <input
                      ref={(el) => {
                        if (el) inputRefs.current.set(t.key, el);
                        else inputRefs.current.delete(t.key);
                      }}
                      className="plan-goals__input"
                      value={t.text}
                      onChange={(e) => updateTask(s.id, t.key, e.target.value)}
                      onKeyDown={(e) => onKeyDown(e, si, t)}
                      placeholder="세부 목표를 입력해주세요."
                      aria-label={`${s.name} 세부 목표`}
                      enterKeyHint="next"
                    />
                    <button
                      type="button"
                      className="plan-goals__remove"
                      onClick={() => removeTask(s.id, t.key)}
                      aria-label="세부 목표 삭제"
                    >
                      <CloseIcon size={16} />
                    </button>
                  </li>
                ))}
              </ul>

              <SubjectSuggest
                label="지난번에 이어서"
                items={carriedFor(s)}
                onPick={(item) => addCarried(s.id, item.name)}
              />

              <button type="button" className="plan-goals__add" onClick={() => addTask(s.id)}>
                <PlusIcon size={14} />
                세부 목표 추가
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="plan-goals__footer">
        <button type="button" className="plan-goals__start" onClick={begin}>
          집중 시작
        </button>
      </div>
    </div>
  );
}
