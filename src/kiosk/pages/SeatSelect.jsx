import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import KioskHeader from '../components/KioskHeader.jsx';
import FloorPlan from '../../components/FloorPlan.jsx';
import { zoneOf, zoneStats } from '../../data/seats.js';
import './SeatSelect.css';

const UNIT = 35;

export default function SeatSelect() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [selected, setSelected] = useState(null);
  const zone = selected && zoneOf(selected);

  return (
    <>
      <KioskHeader title="좌석" />
      <div className="k-seat-page">
        <p className="k-seat-page__title">좌석을 선택해주세요.</p>

        <ul className="k-seat-zones">
          {zoneStats.map((z) => (
            <li key={z.id}>
              <b>{z.id}</b>
              {z.name}
              <em>{z.available}석</em>
            </li>
          ))}
        </ul>

        <FloorPlan unit={UNIT} variant="kiosk" selected={selected} onSelect={setSelected} />

        <div className="k-seat-legend">
          <span>
            <i className="k-seat-legend__dot" /> 선택 가능
          </span>
          <span>
            <i className="k-seat-legend__dot k-seat-legend__dot--occupied" /> 사용 중
          </span>
          <span>
            <i className="k-seat-legend__dot k-seat-legend__dot--selected" /> 선택
          </span>
        </div>

        <button
          type="button"
          className="k-btn k-seat-page__submit"
          disabled={selected === null}
          onClick={() => navigate('/done', { replace: true, state: { ...state, seat: selected } })}
        >
          {zone ? `${zone.name} ${selected} 선택 완료` : '선택 완료'}
        </button>
      </div>
    </>
  );
}
