import { useNavigate } from 'react-router-dom';
import './PassDone.css';

export default function PassDone() {
  const navigate = useNavigate();

  return (
    <div className="pass-done">
      <h1 className="pass-done__title">결제가 완료되었습니다.</h1>
      <p className="pass-done__desc">
        매장에서 키오스크의 QR을 스캔하면
        <br />
        보유 이용권으로 체크인할 수 있어요.
      </p>
      <button type="button" className="pass-done__home" onClick={() => navigate('/', { replace: true })}>
        홈으로
      </button>
    </div>
  );
}
