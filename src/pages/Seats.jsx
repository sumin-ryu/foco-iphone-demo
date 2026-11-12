import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FloorPlan from '../components/FloorPlan.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { ChevronRightIcon } from '../components/icons.jsx';
import { seatLabel, zoneStats } from '../data/seats.js';
import { SEATS } from '../store/AppStore.jsx';
import './pages.css';
import './Seats.css';

const UNIT = 24;

export default function Seats() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const used = SEATS.occupied.length;

  return (
    <>
      <PageHeader title="좌석 현황" />
      <div className="page">
        <div className="card card--soft seats-summary">
          <div>
            <p className="card__label">사용 중</p>
            <p className="card__big">{used}</p>
          </div>
          <div>
            <p className="card__label">남은 좌석</p>
            <p className="card__big">{SEATS.total - used}</p>
          </div>
          <div>
            <p className="card__label">전체</p>
            <p className="card__big">{SEATS.total}</p>
          </div>
        </div>

        <div className="card seats-map">
          <FloorPlan
            unit={UNIT}
            selected={selected}
            onSelect={setSelected}
            onRoomSelect={(room) => navigate(`/rooms?room=${room}`)}
          />
          <div className="seat-legend">
            <span><i className="seat-dot" /> 이용 가능</span>
            <span><i className="seat-dot seat-dot--occupied" /> 사용 중</span>
            <span><i className="seat-dot seat-dot--selected" /> 선택</span>
          </div>
        </div>

        <ul className="card seat-zones">
          {zoneStats.map((z) => (
            <li key={z.id} className="seat-zone">
              <b className="seat-zone__id">{z.id}</b>
              <div className="seat-zone__text">
                <p className="seat-zone__name">{z.name}</p>
                <p className="seat-zone__desc">{z.desc}</p>
              </div>
              <p className="seat-zone__count">
                <strong>{z.available}</strong> / {z.total}
              </p>
            </li>
          ))}
        </ul>

        <Link to="/rooms" className="card seat-rooms">
          <div>
            <p className="seat-zone__name">스터디룸 예약</p>
            <p className="seat-zone__desc">4인 · 6인 룸을 2H · 4H 단위로 예약해요</p>
          </div>
          <ChevronRightIcon size={18} />
        </Link>

        <button
          type="button"
          className="btn btn--primary"
          disabled={selected === null}
          onClick={() => navigate('/check-in')}
        >
          {selected === null ? '좌석을 선택해주세요' : `${seatLabel(selected)} 좌석으로 체크인`}
        </button>
      </div>
    </>
  );
}
