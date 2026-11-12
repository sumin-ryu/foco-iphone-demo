import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import BalanceRadar from '../components/BalanceRadar.jsx';
import FocusMark from '../components/FocusMark.jsx';
import HourColumns from '../components/HourColumns.jsx';
import PageHeader from '../components/PageHeader.jsx';
import TypeScatter from '../components/TypeScatter.jsx';
import { ChevronRightIcon } from '../components/icons.jsx';
import { ITEM_COLORS } from '../data/focusColors.js';
import { ALL_ROUND } from '../data/focusTypes.js';
import { moodLabel } from '../data/feedback.js';
import { FADE_MINUTES, summarizeMonth } from '../data/monthSummary.js';
import { MIN_COMPARE_VISITS, MIN_TYPE_VISITS, summarizePattern } from '../data/pattern.js';
import { formatHM, parseKey } from '../data/records.js';
import { useDarkScreen } from '../hooks/useDarkScreen.js';
import { useRecords } from '../hooks/useRecords.js';
import { getPassLevel } from '../store/AppStore.jsx';
import './pages.css';
import './MonthSummary.css';

const MONTH_PARAM = /^(\d{4})-(\d{2})$/;
const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
const MAX_CART_QTY = 9;

const percent = (ratio) => `${Math.round(ratio * 100)}%`;
/** Picks 은/는-style particles by whether the word ends with a final consonant. */
const josa = (word, withFinal, withoutFinal) => {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  return code >= 0 && code <= 11171 && code % 28 ? withFinal : withoutFinal;
};

function hourInsight({ curve, fadeIndex }) {
  if (fadeIndex === -1) {
    return `${curve.length}시간째까지 매시간 평균 ${FADE_MINUTES}분 넘게 집중을 이어갔어요.`;
  }
  if (fadeIndex === 0) {
    return `첫 1시간부터 평균 ${curve[0].avg}분으로, 휴식이 잦았어요.`;
  }
  const held = Math.min(...curve.slice(0, fadeIndex).map((c) => c.avg));
  const faded = curve[fadeIndex];
  const cause =
    faded.unused > faded.rest
      ? `이용권을 다 쓰지 않고 나간 시간(평균 ${faded.unused}분)이 컸어요.`
      : `휴식이 평균 ${faded.rest}분으로 길어졌어요.`;
  return `${fadeIndex}시간째까지는 평균 ${held}분 넘게 집중했지만, ${fadeIndex + 1}시간째부터 ${
    faded.avg
  }분으로 떨어졌어요. ${cause}`;
}

/** What the month's type means for this member, in their own numbers. */
function typeLine({ type, points }) {
  if (type.id !== ALL_ROUND.id) {
    return `${type.desc} ${points.length}번 중 ${type.count}번을 이렇게 공부했어요.`;
  }
  if (type.bySlot.length) return type.desc;
  // Every type name ends in 형, so 과 / 을 always fit.
  return `${type.pair[0].name}과 ${type.pair[1].name}을 날마다 바꿔 가며 공부했어요.`;
}

/** The quadrants that make up the month's type. */
const typeQuadrants = (type) => {
  if (!type) return [];
  if (type.id !== ALL_ROUND.id) return [type.main];
  return type.bySlot.length ? type.bySlot.map((s) => s.type) : type.pair;
};

/** The biggest change against last month, said plainly. */
function balanceLine(balance, prev, prevLabel) {
  if (!prev) return '다음 달부터 이번 달과 비교해서 보여드릴게요.';
  const [biggest] = balance
    .map((axis, i) => ({ ...axis, diff: Math.round((axis.value - prev[i].value) * 100) }))
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
  if (Math.abs(biggest.diff) < 5) {
    return `${prevLabel}${josa(prevLabel, '과', '와')} 비슷한 균형으로 공부했어요.`;
  }
  return `${prevLabel}보다 ${biggest.label}${josa(biggest.label, '이', '가')} ${Math.abs(biggest.diff)}%p ${
    biggest.diff > 0 ? '늘었어요' : '줄었어요'
  }.`;
}

/**
 * A month in review that doubles as a guide for the next one: how focus held up within a
 * pass, when check-ins went best, how subjects and detail goals went, and which passes were
 * used — ending in a suggested pass, check-in time and subject split that lead straight to
 * buying passes and making a plan.
 */
function feedbackInsight(f) {
  const slotNote = f.badSlot ? `아쉬웠던 날은 주로 ${f.badSlot.label}에 입실했어요.` : '';
  if (f.goodRate != null && f.badRate != null && Math.abs(f.goodRate - f.badRate) >= 0.05) {
    return `잘 됐다고 한 날은 집중률이 ${percent(f.goodRate)}, 아쉬웠던 날은 ${percent(
      f.badRate,
    )}였어요. ${slotNote}`.trim();
  }
  if (slotNote) return slotNote;
  return f.rated ? `이번 달 ${f.rated}번 집중을 돌아봤어요.` : null;
}

const noteDate = ({ key, start }) => {
  const d = parseKey(key);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${start}`;
};

export default function MonthSummary() {
  useDarkScreen();
  const { records } = useRecords();
  const navigate = useNavigate();
  const { month: param } = useParams();
  const match = MONTH_PARAM.exec(param ?? '');
  if (!match) return <Navigate to="/record" replace />;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const summary = summarizeMonth(records, year, month);
  const title = `${month + 1}월 요약`;

  if (!summary) {
    return (
      <>
        <PageHeader title={title} />
        <div className="page">
          <p className="page__lead">이 달에는 집중한 기록이 없어요.</p>
          <Link to="/record" className="btn btn--secondary">
            캘린더로 돌아가기
          </Link>
        </div>
      </>
    );
  }

  const s = summary;
  const p = summarizePattern(year, month);
  const prevLabel = `${p.prevMonth + 1}월`;
  const well = p.wentWell;
  const nextLabel = s.inProgress ? `남은 ${month + 1}월` : `${((month + 1) % 12) + 1}월`;
  const dayLabel = s.bestDays.map((d) => DAY_NAMES[d]).join('·');
  const maxDayFocus = Math.max(...s.weekdays.map((d) => d.focus));
  const mostUsedPass = [...s.passes].sort((a, b) => b.count - a.count)[0];
  const passReason =
    mostUsedPass.hours > s.recommendedPass
      ? `집중이 ${s.sustainedHours}시간째까지 이어졌어요. 주로 쓴 ${mostUsedPass.hours}H PASS보다 ${s.recommendedPass}H로 자주 오는 게 남는 시간 없이 쓸 수 있어요.`
      : `집중이 ${s.sustainedHours}시간째까지 이어졌어요. ${s.recommendedPass}H 단위로 끊어 쓰면 흐름을 유지하기 좋아요.`;

  const buyPasses = () =>
    navigate('/pass/buy', {
      state: { cart: { [s.recommendedPass]: Math.min(MAX_CART_QTY, s.visitsPerWeek) } },
    });
  const makePlan = () =>
    navigate('/plan/new', {
      state: {
        draft: {
          memo: `${nextLabel} 플랜`,
          subjects: [...s.plannedShares]
            .sort((a, b) => b.next - a.next)
            .map(({ name, goal }) => ({ name, goal })),
        },
      },
    });

  return (
    <>
      <PageHeader title={title} />
      <div className="page report-page month">
        <section className="month__hero">
          <p className="month__eyebrow">
            {year}년 {month + 1}월{s.inProgress && ' · 진행 중'}
          </p>
          <p className="month__total">{formatHM(s.focus)}</p>
          <p className="month__total-label">총 집중 · 휴식 {formatHM(s.rest)}</p>
          <dl className="month__stats">
            <div>
              <dt>방문</dt>
              <dd>{s.visits}일</dd>
            </div>
            <div>
              <dt>이용권</dt>
              <dd>{s.passMinutes / 60}H</dd>
            </div>
            <div>
              <dt>활용률</dt>
              <dd>{percent(s.utilization)}</dd>
            </div>
          </dl>
        </section>

        <h2 className="section-title month__title">이번 달 나의 집중 유형</h2>
        <section className="card month__glass month__type">
          {p.type ? (
            <>
              <p className="month__type-name">{p.type.name}</p>
              <p className="month__type-tag">{p.type.tag}</p>
              <p className="month__type-line">{typeLine(p)}</p>
              {p.type.bySlot.length > 0 && (
                <ul className="month__type-slots">
                  {p.type.bySlot.map((s) => (
                    <li key={s.slot.id}>
                      <i className={`type-scatter__dot is-${s.slot.id}`} />
                      <span>{s.slot.label}</span>
                      <strong>
                        {s.type.name}
                        <small>{s.type.tag}</small>
                      </strong>
                      <em>
                        {s.count}/{s.total}회
                      </em>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className="month__type-line">
              방문이 {MIN_TYPE_VISITS}번 쌓이면 유형을 알려드릴게요. 지금 {p.points.length}번이에요.
            </p>
          )}
          <TypeScatter points={p.points} highlight={typeQuadrants(p.type)} />
          <p className="month__insight">
            점 하나가 방문 한 번이에요. 가로는 한 번에 이어서 집중한 시간, 세로는 함께 공부한
            과목 수예요.
          </p>
          <div className="month__type-links">
            {p.type && (
              <Link to={`/types/${p.type.id}`}>
                {p.type.name} 자세히 보기
                <ChevronRightIcon size={16} />
              </Link>
            )}
            <Link to="/types">
              모든 유형 보기
              <ChevronRightIcon size={16} />
            </Link>
          </div>
        </section>

        <h2 className="section-title month__title">
          {p.prevBalance ? `${prevLabel}과 비교하면` : '이번 달 집중 균형'}
        </h2>
        <section className="card month__glass">
          <BalanceRadar
            balance={p.balance}
            prev={p.prevBalance}
            labels={[`${month + 1}월`, prevLabel]}
          />
          <ul className="month__balance">
            {p.balance.map((axis, i) => (
              <li key={axis.id}>
                <span className="month__balance-label">
                  {axis.label}
                  <small>{axis.detail}</small>
                </span>
                <strong>{percent(axis.value)}</strong>
                {p.prevBalance && (
                  <em>
                    {prevLabel} {percent(p.prevBalance[i].value)}
                  </em>
                )}
              </li>
            ))}
          </ul>
          <p className="month__insight">{balanceLine(p.balance, p.prevBalance, prevLabel)}</p>
        </section>

        <h2 className="section-title month__title">몇 시간째까지 집중이 이어졌나요</h2>
        <section className="month__block">
          <HourColumns curve={s.curve} fadeIndex={s.fadeIndex} />
          <p className="month__insight">{hourInsight(s)}</p>
        </section>

        <h2 className="section-title month__title">언제 집중이 잘 됐나요</h2>
        <section className="card month__glass">
          <ul className="month__slots">
            {s.slots.map((slot) => (
              <li
                key={slot.id}
                className={`month__slot ${slot.id === s.bestSlot?.id ? 'is-best' : ''} ${
                  slot.count ? '' : 'is-empty'
                }`}
              >
                <span className="month__slot-label">
                  {slot.label} 입실<em>{slot.count}회</em>
                </span>
                <span className="month__meter">
                  <i style={{ width: percent(slot.focusRate) }} />
                </span>
                <strong>{slot.count ? percent(slot.focusRate) : '-'}</strong>
              </li>
            ))}
          </ul>
          <div className="month__days" aria-label="요일별 집중 시간">
            {s.weekdays.map((d) => (
              <div
                key={d.day}
                className={`month__day ${s.bestDays.includes(d.day) ? 'is-best' : ''}`}
              >
                <span className="month__day-bar">
                  <i style={{ height: maxDayFocus ? percent(d.focus / maxDayFocus) : 0 }} />
                </span>
                <span>{DAY_NAMES[d.day]}</span>
              </div>
            ))}
          </div>
          <p className="month__insight">
            {s.bestSlot.label}에 입실한 날 집중률이 {percent(s.bestSlot.focusRate)}로 가장 높았고,{' '}
            {dayLabel}요일에 가장 많이 집중했어요.
          </p>
        </section>

        <h2 className="section-title month__title">과목별 집중</h2>
        <section className="card month__glass">
          <ul className="month__subjects">
            {s.subjects.map((subject, i) => (
              <li key={subject.name} className="month__subject">
                <div className="month__subject-head">
                  <span className="month__subject-name">
                    {subject.name}
                    <em>{percent(subject.share)}</em>
                  </span>
                  <strong>{formatHM(Math.round(subject.ms / 60000))}</strong>
                </div>
                <span className="month__meter">
                  <i
                    style={{
                      width: percent(subject.share),
                      background: ITEM_COLORS[i % ITEM_COLORS.length],
                    }}
                  />
                </span>
                {subject.parts.length > 0 && (
                  <p className="month__subject-parts">
                    {subject.parts.map((part) => `${part.name} ${percent(part.share)}`).join(' · ')}
                  </p>
                )}
                <p className={`month__subject-goal ${subject === s.lagging ? 'is-lagging' : ''}`}>
                  세부 목표 {subject.done}/{subject.tasks} 완료 · {percent(subject.doneRate)}
                </p>
              </li>
            ))}
          </ul>
          {s.lagging && (
            <p className="month__insight">
              {s.lagging.name}
              {josa(s.lagging.name, '은', '는')} 세부 목표 완료가 {percent(s.lagging.doneRate)}로
              가장 낮았어요.
            </p>
          )}
        </section>

        {s.feedback && (
          <>
            <h2 className="section-title month__title">스스로 돌아본 집중</h2>
            <section className="card month__glass">
              {s.feedback.rated > 0 && (
                <div className="month__moods">
                  {s.feedback.moods.map((m) => (
                    <div key={m.id} className={`month__mood ${m.count ? '' : 'is-empty'}`}>
                      <strong>{m.count}</strong>
                      <span>{m.label}</span>
                    </div>
                  ))}
                </div>
              )}
              {s.feedback.notes.length > 0 && (
                <ul className="month__notes">
                  {s.feedback.notes.map((n) => (
                    <li key={`${n.key}-${n.start}`} className="month__note">
                      <p className="month__note-head">
                        {noteDate(n)}
                        {n.mood && <span>{moodLabel(n.mood)}</span>}
                      </p>
                      {n.note && <p className="month__note-text">{n.note}</p>}
                      {n.text && <p className="month__note-text">{n.text}</p>}
                    </li>
                  ))}
                </ul>
              )}
              {feedbackInsight(s.feedback) && (
                <p className="month__insight">{feedbackInsight(s.feedback)}</p>
              )}
            </section>
          </>
        )}

        <h2 className="section-title month__title">사용한 이용권</h2>
        <section className="month__passes">
          {s.passes.map((p) => (
            <div key={p.hours} className="card month__pass">
              <FocusMark level={getPassLevel(p.hours)} size={28} strokeWidth={1.6} />
              <p className="month__pass-name">
                {p.hours}H PASS<em>× {p.count}</em>
              </p>
              <p className="month__pass-unused">
                {p.avgUnused < 10 ? '거의 다 썼어요' : `평균 ${formatHM(p.avgUnused)} 남김`}
              </p>
            </div>
          ))}
        </section>

        <h2 className="section-title month__title month__title--next">
          {nextLabel}은 이렇게 해보세요
        </h2>
        <section className="month__tips">
          <article className="card month__glass month__tip">
            <p className="month__tip-label">잘 됐던 날처럼</p>
            {!well ? (
              <>
                <p className="month__tip-main">기록이 더 쌓이면 알려드릴게요</p>
                <p className="month__tip-reason">
                  방문이 {MIN_COMPARE_VISITS}번 넘게 쌓이면 세부 목표를 많이 끝낸 날의 공부 방식을
                  찾아드려요. 지금 {p.points.length}번이에요.
                </p>
              </>
            ) : well.even ? (
              <>
                <p className="month__tip-main">지금 방식 그대로</p>
                <p className="month__tip-reason">
                  어떤 방식으로 공부한 날이든 세부 목표를 비슷하게 끝냈어요.
                </p>
              </>
            ) : (
              <>
                <p className="month__tip-main">{well.best.tip}</p>
                <p className="month__tip-reason">
                  {well.best.label}엔 세부 목표를 평균 {percent(well.best.rate)} 끝냈어요.{' '}
                  {well.other.label}은 {percent(well.other.rate)}였어요. 내 기록에서 보인
                  경향이에요.
                </p>
              </>
            )}
          </article>
          <article className="card month__glass month__tip">
            <p className="month__tip-label">이용권</p>
            <p className="month__tip-main">
              {s.recommendedPass}H PASS · 주 {s.visitsPerWeek}회
            </p>
            <p className="month__tip-reason">{passReason}</p>
          </article>
          <article className="card month__glass month__tip">
            <p className="month__tip-label">입실 시간</p>
            <p className="month__tip-main">
              {s.bestSlot.label} · {dayLabel}요일
            </p>
            <p className="month__tip-reason">
              {s.bestSlot.label} 입실 집중률 {percent(s.bestSlot.focusRate)}, {dayLabel}요일 집중
              시간이 가장 길었어요.
            </p>
          </article>
          {s.subjectAdvice === 'split' && (
            <article className="card month__glass month__tip">
              <p className="month__tip-label">과목 배분</p>
              <p className="month__tip-main">{s.lagging.name} · 세부 목표 더 작게</p>
              <p className="month__tip-reason">
                시간은 {percent(s.lagging.share)}로 충분히 썼지만 세부 목표는{' '}
                {percent(s.lagging.doneRate)}만 끝냈어요. 한 번 입실에 끝낼 수 있는 크기로 나눠
                보세요.
              </p>
            </article>
          )}
          {s.subjectAdvice === 'shift' && (
            <article className="card month__glass month__tip">
              <p className="month__tip-label">과목 배분</p>
              {[s.lagging, s.donor].map((subject) => {
                const plan = s.plannedShares.find((p) => p.name === subject.name);
                return (
                  <p key={subject.name} className="month__tip-main month__tip-shift">
                    {subject.name}
                    <span>
                      {percent(plan.now)} → <strong>{percent(plan.next)}</strong>
                    </span>
                  </p>
                );
              })}
              <p className="month__tip-reason">
                {s.donor.name}
                {josa(s.donor.name, '은', '는')} 세부 목표를 {percent(s.donor.doneRate)} 끝냈어요.
                남는 시간을 {s.lagging.name}에 나눠 보세요.
              </p>
            </article>
          )}
        </section>

        <div className="month__actions">
          <button type="button" className="btn btn--primary" onClick={buyPasses}>
            {s.recommendedPass}H PASS {Math.min(MAX_CART_QTY, s.visitsPerWeek)}장 담기
          </button>
          <button type="button" className="btn btn--secondary" onClick={makePlan}>
            {s.subjectAdvice === 'shift' ? '이 배분으로 플랜 만들기' : '이 과목들로 플랜 만들기'}
          </button>
        </div>
      </div>
    </>
  );
}
