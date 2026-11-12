import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import KioskShell from './components/KioskShell.jsx';
import { MEMBER_CHECK_IN, MEMBER_CHECK_OUT } from './components/KioskQrView.jsx';
import Home from './pages/Home.jsx';
import CheckInDialog from './pages/CheckInDialog.jsx';
import QrScan from './pages/QrScan.jsx';
import PassSelect from './pages/PassSelect.jsx';
import Payment from './pages/Payment.jsx';
import SeatSelect from './pages/SeatSelect.jsx';
import Complete from './pages/Complete.jsx';

const MEMBER_STATE = { member: true };
const HOME_PATHS = ['/', '/check-in'];

/*
 * /                    홈 (입실 / 퇴실)
 * /check-in            회원·비회원 선택 다이얼로그 (홈 위에 표시)
 * /member              회원 QR 스캔 → /pass
 * /pass                PASS 선택 → 사용하기: /seat, 구매하기: /payment
 * /payment             결제 → /seat
 * /seat                좌석 선택 → /done
 * /done                입실 완료 → 잠시 후 /
 * /check-out           퇴실 QR 스캔 → /check-out/done
 * /check-out/done      퇴실 완료 → 잠시 후 /
 */
export default function KioskApp() {
  const location = useLocation();
  // Keep the home screen mounted while the check-in dialog opens over it.
  const pageKey = HOME_PATHS.includes(location.pathname) ? 'home' : location.key;

  return (
    <KioskShell>
      <div className="kiosk-page" key={pageKey}>
        <Routes>
          <Route path="/" element={<Home />}>
            <Route path="check-in" element={<CheckInDialog />} />
          </Route>
          <Route
            path="member"
            element={
              <QrScan
                label={MEMBER_CHECK_IN.label}
                hint={MEMBER_CHECK_IN.hint}
                next="/pass"
                nextState={MEMBER_STATE}
              />
            }
          />
          <Route path="pass" element={<PassSelect />} />
          <Route path="payment" element={<Payment />} />
          <Route path="seat" element={<SeatSelect />} />
          <Route path="done" element={<Complete type="check-in" />} />
          <Route
            path="check-out"
            element={
              <QrScan
                label={MEMBER_CHECK_OUT.label}
                hint={MEMBER_CHECK_OUT.hint}
                next="/check-out/done"
              />
            }
          />
          <Route path="check-out/done" element={<Complete type="check-out" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </KioskShell>
  );
}
