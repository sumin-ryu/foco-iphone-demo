import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import TypeGlyph from '../components/TypeGlyph.jsx';
import { ChevronRightIcon } from '../components/icons.jsx';
import { ALL_ROUND, FOCUS_TYPES } from '../data/focusTypes.js';
import { MIN_TYPE_VISITS, monthlyTypes } from '../data/pattern.js';
import { TODAY_KEY } from '../data/records.js';
import { useDarkScreen } from '../hooks/useDarkScreen.js';
import './pages.css';
import './Types.css';

/** Same layout as the type chart: several subjects on top, long stretches on the right. */
const GRID = ['relay', 'triathlon', 'sprint', 'marathon'].map((id) =>
  FOCUS_TYPES.find((t) => t.id === id),
);

function TypeCard({ type, current, wide = false }) {
  return (
    <Link to={`/types/${type.id}`} className={`card types__glass types__card ${wide ? 'is-wide' : ''}`}>
      <TypeGlyph type={type} size={wide ? 32 : 28} />
      <div className="types__card-text">
        <p className="types__card-name">{type.name}</p>
        <p className="types__card-tag">{type.tag}</p>
      </div>
      {current && <span className="types__badge">이번 달</span>}
    </Link>
  );
}

/** Every study type at a glance, and which one each month came out as. */
export default function Types() {
  useDarkScreen();
  const history = monthlyTypes();
  const thisMonth = TODAY_KEY.slice(0, 7);
  const currentId = history.find((h) => h.key === thisMonth)?.type?.id;

  return (
    <>
      <PageHeader title="집중 유형" />
      <div className="page report-page types">
        <p className="types__lead">
          한 번에 이어서 집중하는 시간(50분 기준)과 한 번 입실에 공부하는 과목 수로 나눠요. 한
          달 동안 쌓인 방문으로 그달의 유형이 정해져요.
        </p>
        <section className="types__grid">
          {GRID.map((type) => (
            <TypeCard key={type.id} type={type} current={type.id === currentId} />
          ))}
        </section>
        <TypeCard type={ALL_ROUND} current={ALL_ROUND.id === currentId} wide />

        <h2 className="section-title types__title">내 월별 유형</h2>
        <ul className="card types__glass types__rows">
          {history.map((h) => (
            <li key={h.key}>
              <Link to={`/record/month/${h.key}`} className="types__row">
                <span className="types__row-label">
                  {h.month + 1}월{h.key === thisMonth && <em>진행 중</em>}
                </span>
                {h.type ? (
                  <span className="types__row-type">
                    <TypeGlyph type={h.type} size={16} />
                    {h.type.name}
                  </span>
                ) : (
                  <span className="types__row-empty">
                    방문 {h.visits}번 · {MIN_TYPE_VISITS}번부터 보여요
                  </span>
                )}
                <ChevronRightIcon size={18} />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
