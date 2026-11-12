import { Link, useNavigate } from 'react-router-dom';
import { CloseIcon } from '../../components/icons.jsx';
import './CheckInDialog.css';

export default function CheckInDialog() {
  const navigate = useNavigate();
  const close = () => navigate('/');

  return (
    <div className="k-dialog" onClick={close}>
      <div
        className="k-dialog__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="k-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="k-dialog__close" aria-label="닫기" onClick={close}>
          <CloseIcon size={26} />
        </button>
        <h2 id="k-dialog-title" className="k-dialog__title">
          어떻게 이용하시겠어요?
        </h2>

        <Link to="/member" className="k-dialog__option k-dialog__option--member">
          <strong>회원</strong>
          <span>
            FOCO 앱으로 연결해
            <br />
            보유 PASS를 사용할 수 있어요.
          </span>
        </Link>
        <Link
          to="/pass"
          state={{ member: false }}
          className="k-dialog__option k-dialog__option--guest"
        >
          <strong>비회원</strong>
          <span>
            이용권을 선택하고
            <br />
            결제 후 바로 입실할 수 있어요.
          </span>
        </Link>
      </div>
    </div>
  );
}
