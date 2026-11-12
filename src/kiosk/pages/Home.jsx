import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AsteriskIcon } from '../../components/icons.jsx';
import { CheckInIcon, CheckOutIcon } from '../components/icons.jsx';
import './Home.css';

/** Matches the `k-arrow-go` animation so the arrow finishes moving before the screen changes. */
const ARROW_MS = 320;

export default function Home() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  /** Pre-equalization look: check-in navy, check-out gray. */
  const legacy = searchParams.get('style') === 'legacy';
  const [leavingTo, setLeavingTo] = useState(null);

  // Home stays mounted under the check-in dialog, so reset once it is closed.
  useEffect(() => {
    if (pathname === '/') setLeavingTo(null);
  }, [pathname]);

  useEffect(() => {
    if (!leavingTo) return undefined;
    const id = setTimeout(() => navigate(leavingTo), ARROW_MS);
    return () => clearTimeout(id);
  }, [leavingTo, navigate]);

  const actionProps = (to) => ({
    to,
    onClick: (e) => {
      e.preventDefault();
      if (!leavingTo) setLeavingTo(to);
    },
  });

  const leavingClass = (to) => (leavingTo === to ? 'k-home__action--leaving' : '');

  return (
    <div className="k-home">
      <AsteriskIcon className="k-home__mark" size={96} />
      <p className="k-home__title">오늘의 이용을 시작하세요.</p>

      <div className="k-home__actions">
        <Link
          {...actionProps('/check-in')}
          className={`k-home__action ${legacy ? 'k-home__action--in' : ''} ${leavingClass('/check-in')}`}
        >
          <CheckInIcon size={64} />
          <span className="k-home__label">
            <span className="k-home__label-en">CHECK-IN</span>
            <span className="k-home__label-ko">입실하기</span>
          </span>
        </Link>
        <Link
          {...actionProps('/check-out')}
          className={`k-home__action ${legacy ? 'k-home__action--out' : ''} ${leavingClass('/check-out')}`}
        >
          <CheckOutIcon size={64} />
          <span className="k-home__label">
            <span className="k-home__label-en">CHECK-OUT</span>
            <span className="k-home__label-ko">퇴실하기</span>
          </span>
        </Link>
      </div>

      <Outlet />
    </div>
  );
}
