import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import FocusReport from '../components/FocusReport.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { parseKey } from '../data/records.js';
import { ROOM_HISTORY, roomOf, slotLabel } from '../data/rooms.js';
import { useRecords } from '../hooks/useRecords.js';
import './pages.css';
import './RecordDetail.css';

export default function RecordDetail() {
  const { date } = useParams();
  const [params, setParams] = useSearchParams();
  const record = useRecords().records[date];
  const room = ROOM_HISTORY[date];
  const d = parseKey(date);
  if (Number.isNaN(d.getTime())) return <Navigate to="/record" replace />;
  const title = `${d.getMonth() + 1}월 ${d.getDate()}일 기록`;

  if (!record) {
    return (
      <>
        <PageHeader title={title} />
        <div className="page">
          <p className="page__lead">이 날은 집중한 기록이 없어요.</p>
          <Link to="/record" className="btn btn--secondary">
            캘린더로 돌아가기
          </Link>
        </div>
      </>
    );
  }

  const { visits } = record;
  const picked = Number(params.get('visit'));
  const index = picked >= 1 && picked <= visits.length ? picked - 1 : visits.length - 1;

  return (
    <>
      <PageHeader title={title} />
      <div className="page report-page">
        {visits.length > 1 && (
          <div className="record-detail__visits" role="tablist" aria-label="방문 선택">
            {visits.map((v, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === index}
                className={`record-detail__visit ${i === index ? 'is-selected' : ''}`}
                onClick={() => setParams({ visit: String(i + 1) }, { replace: true })}
              >
                {i + 1}회차
                <span>
                  {v.pass}H · {v.startLabel}
                </span>
              </button>
            ))}
          </div>
        )}
        <FocusReport key={index} result={visits[index].report} />
        {room && (
          <>
            <h2 className="section-title record-detail__room-title">스터디룸</h2>
            <section className="card record-detail__room">
              <div>
                <p className="record-detail__room-name">{room.title}</p>
                <p className="list__sub">
                  {roomOf(room.roomId).name} · {slotLabel(room.start, room.hours)}
                </p>
              </div>
              <strong>{room.hours}H</strong>
            </section>
          </>
        )}
      </div>
    </>
  );
}
