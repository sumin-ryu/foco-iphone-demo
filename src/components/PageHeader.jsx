import { useNavigate } from 'react-router-dom';
import { ChevronLeftIcon } from './icons.jsx';
import './PageHeader.css';

export default function PageHeader({ title, back = true, onBack }) {
  const navigate = useNavigate();

  const goBack = () => {
    if (onBack) onBack();
    else if (window.history.state?.idx > 0) navigate(-1);
    else navigate('/', { replace: true });
  };

  return (
    <header className="page-header">
      {back ? (
        <button
          type="button"
          className="page-header__back"
          onClick={goBack}
          aria-label="뒤로 가기"
        >
          <ChevronLeftIcon />
        </button>
      ) : (
        <span className="page-header__spacer" />
      )}
      <h1 className="page-header__title">{title}</h1>
      <span className="page-header__spacer" />
    </header>
  );
}
