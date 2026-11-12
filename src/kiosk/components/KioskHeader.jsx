import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from './icons.jsx';
import './KioskHeader.css';

export default function KioskHeader({ title, caps = false, onBack }) {
  const navigate = useNavigate();
  return (
    <header className="k-header">
      <button
        type="button"
        className="k-header__icon"
        aria-label="뒤로"
        onClick={onBack ?? (() => navigate(-1))}
      >
        <ArrowLeftIcon />
      </button>
      <h1 className={`k-header__title ${caps ? 'k-header__title--caps' : ''}`}>{title}</h1>
      <span />
    </header>
  );
}
