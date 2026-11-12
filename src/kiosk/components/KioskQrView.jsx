import KioskHeader from './KioskHeader.jsx';
import { CheckIcon } from '../../components/icons.jsx';
import { QR_SIZE, buildQrPath } from '../../components/fakeQr.js';
import '../pages/QrScan.css';

const QR_PATH = buildQrPath(19870605);

export const MEMBER_CHECK_IN = {
  label: 'MEMBER CHECK-IN',
  hint: 'FOCO 앱 홈의 체크인 버튼을 눌러\n스캔할 수 있어요.',
};

export const MEMBER_CHECK_OUT = {
  label: 'CHECK-OUT',
  hint: 'FOCO 앱 홈의 퇴실 버튼을 눌러\n스캔할 수 있어요.',
};

/**
 * The kiosk's QR screen without any navigation, so the phone app can show the
 * very same screen inside its camera view.
 */
export default function KioskQrView({ label, hint, scanned, onScan, onBack }) {
  return (
    <>
      <KioskHeader title={label} caps onBack={onBack} />
      <div className="k-qr">
        <p className="k-qr__title">
          FOCO 앱으로
          <br />
          QR을 스캔해주세요.
        </p>

        <button
          type="button"
          className={`k-qr__code ${scanned ? 'k-qr__code--done' : ''}`}
          aria-label="QR 코드"
          onClick={onScan}
        >
          <svg
            viewBox={`-1 -1 ${QR_SIZE + 2} ${QR_SIZE + 2}`}
            shapeRendering="crispEdges"
            aria-hidden
          >
            <path d={QR_PATH} fill="#111" fillRule="evenodd" />
          </svg>
          {!scanned && <span className="k-qr__beam" />}
          {scanned && (
            <span className="k-qr__success">
              <span className="k-qr__check">
                <CheckIcon size={36} />
              </span>
              연결되었습니다
            </span>
          )}
        </button>

        <p className="k-qr__hint">{hint}</p>
      </div>
    </>
  );
}
