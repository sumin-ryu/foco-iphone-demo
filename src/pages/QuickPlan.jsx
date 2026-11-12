import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import { CloseIcon, PlusIcon } from '../components/icons.jsx';
import { pastSubjects } from '../data/subjects.js';
import { useLastReview } from '../hooks/useLastReview.js';
import { useRecords } from '../hooks/useRecords.js';
import { useAppStore } from '../store/AppStore.jsx';
import './PlanGoals.css';
import './QuickPlan.css';

let draftId = 0;
const nextKey = () => (draftId += 1);
const emptyTask = () => ({ key: nextKey(), text: '' });
const emptySubject = (name = '') => ({ key: nextKey(), name, tasks: [emptyTask()] });

export default function QuickPlan() {
  const navigate = useNavigate();
  const { session, focus, plans, startFocus, startQuickFocus } = useAppStore();
  const { records } = useRecords();
  const { startWith } = useLastReview();
  const [subjects, setSubjects] = useState(() => [emptySubject()]);
  const [shakeKey, setShakeKey] = useState(0);
  const inputRefs = useRef(new Map());
  const focusKeyRef = useRef(null);

  useEffect(() => {
    if (focusKeyRef.current == null) return;
    const el = inputRefs.current.get(focusKeyRef.current);
    el?.focus({ preventScroll: true });
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    focusKeyRef.current = null;
  }, [subjects]);

  if (!session) return <Navigate to="/" replace />;
  if (focus) return <Navigate to="/focus" replace />;

  const suggestions = pastSubjects(plans, records)
    .slice(0, 8)
    .map((s) => s.name);
  const usedNames = new Set(subjects.map((s) => s.name.trim()));

  const registerInput = (key) => (el) => {
    if (el) inputRefs.current.set(key, el);
    else inputRefs.current.delete(key);
  };

  const updateSubject = (key, patch) =>
    setSubjects((all) => all.map((s) => (s.key === key ? { ...s, ...patch } : s)));

  /** Fills the first unnamed card if there is one, otherwise adds a new card. */
  const addSubject = (name = '') => {
    const blank = name && subjects.find((s) => !s.name.trim());
    if (blank) {
      updateSubject(blank.key, { name });
      focusKeyRef.current = blank.tasks[0]?.key ?? null;
      return;
    }
    const subject = emptySubject(name);
    focusKeyRef.current = name ? subject.tasks[0].key : subject.key;
    setSubjects((all) => [...all, subject]);
  };

  const removeSubject = (key) => setSubjects((all) => all.filter((s) => s.key !== key));

  const updateTask = (subjectKey, taskKey, text) =>
    setSubjects((all) =>
      all.map((s) =>
        s.key === subjectKey
          ? { ...s, tasks: s.tasks.map((t) => (t.key === taskKey ? { ...t, text } : t)) }
          : s,
      ),
    );

  const addTask = (subjectKey, afterKey) => {
    const task = emptyTask();
    focusKeyRef.current = task.key;
    setSubjects((all) =>
      all.map((s) => {
        if (s.key !== subjectKey) return s;
        const tasks = [...s.tasks];
        const at = afterKey == null ? tasks.length : tasks.findIndex((t) => t.key === afterKey) + 1;
        tasks.splice(at, 0, task);
        return { ...s, tasks };
      }),
    );
  };

  const removeTask = (subjectKey, taskKey) =>
    setSubjects((all) =>
      all.map((s) =>
        s.key === subjectKey ? { ...s, tasks: s.tasks.filter((t) => t.key !== taskKey) } : s,
      ),
    );

  const onNameKeyDown = (e, subject) => {
    if (e.key !== 'Enter' || e.nativeEvent.isComposing) return;
    e.preventDefault();
    const first = subject.tasks[0];
    if (first) inputRefs.current.get(first.key)?.focus();
    else addTask(subject.key);
  };

  /** Enter on a filled row opens a new row below; on an empty row it leaves the field. */
  const onTaskKeyDown = (e, subject, task) => {
    if (e.key !== 'Enter' || e.nativeEvent.isComposing) return;
    e.preventDefault();
    if (task.text.trim()) addTask(subject.key, task.key);
    else e.currentTarget.blur();
  };

  const begin = () => {
    const filled = subjects
      .filter((s) => s.name.trim())
      .map((s) => ({
        name: s.name.trim(),
        tasks: s.tasks.map((t) => t.text.trim()).filter(Boolean),
      }));
    if (!filled.length) {
      setShakeKey((k) => k + 1);
      const first = subjects[0];
      if (first) inputRefs.current.get(first.key)?.focus();
      else addSubject();
      return;
    }
    startQuickFocus(filled, startWith);
    navigate('/focus', { replace: true });
  };

  const beginFree = () => {
    startFocus(null, {}, startWith);
    navigate('/focus', { replace: true });
  };

  return (
    <div className="plan-goals quick-plan">
      <PageHeader title="즉흥 플랜" />

      <div className="plan-goals__body">
        <h2 className="plan-goals__title">오늘은 무엇을 공부할까요?</h2>
        <p className="plan-goals__lead">
          저장하지 않고 <strong>오늘만 쓰는 플랜</strong>이에요.
          <br />
          과목과 세부 목표를 자유롭게 적어보세요.
        </p>

        {suggestions.length > 0 && (
          <div className="quick-plan__suggest">
            <p className="quick-plan__suggest-label">자주 쓴 과목에서 고르기</p>
            <div className="quick-plan__chips">
              {suggestions.map((name) => {
                const used = usedNames.has(name);
                return (
                  <button
                    key={name}
                    type="button"
                    className={`quick-plan__chip ${used ? 'is-used' : ''}`}
                    onClick={() => addSubject(name)}
                    disabled={used}
                  >
                    {!used && <PlusIcon size={12} />}
                    {name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <ul
          key={shakeKey}
          className={`plan-goals__list quick-plan__list ${shakeKey ? 'is-shaking' : ''}`}
        >
          {subjects.map((s, si) => (
            <li key={s.key} className="plan-goals__card" style={{ '--i': si }}>
              <div className="quick-plan__head">
                <input
                  ref={registerInput(s.key)}
                  className="quick-plan__name"
                  value={s.name}
                  onChange={(e) => updateSubject(s.key, { name: e.target.value })}
                  onKeyDown={(e) => onNameKeyDown(e, s)}
                  placeholder="과목 이름"
                  aria-label={`과목 ${si + 1} 이름`}
                  maxLength={20}
                  autoComplete="off"
                  enterKeyHint="next"
                />
                <button
                  type="button"
                  className="quick-plan__remove"
                  onClick={() => removeSubject(s.key)}
                  aria-label="과목 삭제"
                >
                  삭제
                </button>
              </div>

              <ul className="plan-goals__tasks">
                {s.tasks.map((t) => (
                  <li key={t.key} className="plan-goals__task">
                    <input
                      ref={registerInput(t.key)}
                      className="plan-goals__input"
                      value={t.text}
                      onChange={(e) => updateTask(s.key, t.key, e.target.value)}
                      onKeyDown={(e) => onTaskKeyDown(e, s, t)}
                      placeholder="세부 목표를 입력해주세요."
                      aria-label={`${s.name || `과목 ${si + 1}`} 세부 목표`}
                      autoComplete="off"
                      enterKeyHint="next"
                    />
                    <button
                      type="button"
                      className="plan-goals__remove"
                      onClick={() => removeTask(s.key, t.key)}
                      aria-label="세부 목표 삭제"
                    >
                      <CloseIcon size={16} />
                    </button>
                  </li>
                ))}
              </ul>

              <button type="button" className="plan-goals__add" onClick={() => addTask(s.key)}>
                <PlusIcon size={14} />
                세부 목표 추가
              </button>
            </li>
          ))}
        </ul>

        <button type="button" className="quick-plan__add-subject" onClick={() => addSubject()}>
          <PlusIcon size={16} />
          과목 추가
        </button>
      </div>

      <div className="plan-goals__footer">
        <button type="button" className="plan-goals__start" onClick={begin}>
          집중 시작
        </button>
        <button type="button" className="quick-plan__free" onClick={beginFree}>
          정하지 않고 바로 시작하기
        </button>
      </div>
    </div>
  );
}
