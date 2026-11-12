import { Link, Navigate, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import TypeGlyph from '../components/TypeGlyph.jsx';
import { ChevronRightIcon } from '../components/icons.jsx';
import { ALL_ROUND, ALL_TYPES, typeById } from '../data/focusTypes.js';
import { monthlyTypes, visitsOfType } from '../data/pattern.js';
import { RECORD_KEYS, SLOTS, TODAY_KEY, parseKey } from '../data/records.js';
import { useDarkScreen } from '../hooks/useDarkScreen.js';
import './pages.css';
import './Types.css';

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
const RECENT_VISITS = 3;

const dateLabel = (key) => {
  const d = parseKey(key);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${DAY_NAMES[d.getDay()]})`;
};
const slotLabel = (id) => SLOTS.find((s) => s.id === id)?.label ?? '';

function Section({ title, items }) {
  return (
    <>
      <h2 className="section-title types__title">{title}</h2>
      <ul className="card types__glass types__points">
        {items.map((text) => (
          <li key={text}>{text}</li>
        ))}
      </ul>
    </>
  );
}

/** One study type: what it looks like, when it fits, what to try, and where it shows up in my records. */
export default function TypeDetail() {
  useDarkScreen();
  const { typeId } = useParams();
  const type = typeById(typeId);
  if (!type) return <Navigate to="/types" replace />;

  const allRound = type.id === ALL_ROUND.id;
  const visits = allRound ? [] : visitsOfType(type.id);
  const total = RECORD_KEYS.filter((key) => key <= TODAY_KEY).length;
  const months = monthlyTypes().filter((m) => m.type?.id === type.id);
  const monthNames = months.map((m) => `${m.month + 1}월`).join(', ');

  return (
    <>
      <PageHeader title="집중 유형" />
      <div className="page report-page types">
        <section className="types__hero">
          <TypeGlyph type={type} size={52} />
          <p className="types__hero-name">{type.name}</p>
          <p className="types__hero-tag">{type.tag}</p>
          <p className="types__hero-desc">{type.desc}</p>
        </section>

        <Section title="이런 모습이에요" items={type.scenes} />
        <Section title="이럴 때 잘 맞아요" items={type.fits} />
        <Section title="해보면 좋은 것" items={type.tries} />

        <h2 className="section-title types__title">내 기록에서</h2>
        <section className="card types__glass">
          <p className="types__mine">
            {allRound
              ? months.length
                ? `${monthNames}이 ${type.name}이었어요.`
                : `아직 ${type.name}이었던 달은 없어요.`
              : visits.length
                ? `지금까지 방문 ${total}번 중 ${visits.length}번을 이렇게 공부했어요.`
                : `아직 ${type.name}으로 공부한 날은 없어요.`}
            {!allRound && months.length > 0 && ` ${monthNames}의 유형이기도 해요.`}
          </p>
          {visits.length > 0 && (
            <ul className="types__rows types__rows--inner">
              {visits.slice(0, RECENT_VISITS).map((v) => (
                <li key={v.key}>
                  <Link to={`/record/${v.key}`} className="types__row">
                    <span className="types__row-label">
                      {dateLabel(v.key)}
                      <em>{slotLabel(v.slot)}</em>
                    </span>
                    <span className="types__row-empty">
                      한 번에 {v.block}분 · {v.subjects}과목
                    </span>
                    <ChevronRightIcon size={18} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {allRound && months.length > 0 && (
            <ul className="types__rows types__rows--inner">
              {months.map((m) => (
                <li key={m.key}>
                  <Link to={`/record/month/${m.key}`} className="types__row">
                    <span className="types__row-label">
                      {m.year}년 {m.month + 1}월
                    </span>
                    <span className="types__row-empty">방문 {m.visits}번</span>
                    <ChevronRightIcon size={18} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <h2 className="section-title types__title">다른 유형</h2>
        <section className="types__others">
          {ALL_TYPES.filter((t) => t !== type).map((t) => (
            <Link key={t.id} to={`/types/${t.id}`} replace className="card types__glass types__other">
              <TypeGlyph type={t} size={20} />
              {t.name}
            </Link>
          ))}
        </section>
        <Link to="/types" className="btn btn--secondary types__all">
          모든 유형 보기
        </Link>
      </div>
    </>
  );
}
