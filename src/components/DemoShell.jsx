import { useLocation, useNavigate } from 'react-router-dom';
import IPhoneFrame from './IPhoneFrame.jsx';
import DemoToggle from './DemoToggle.jsx';
import { FAST_SPEED, setClockSpeed, useClockSpeed } from '../hooks/useNow.js';
import { markOnboarded } from '../pages/Onboarding.jsx';
import './DemoShell.css';

/**
 * Phone-demo build: fill the real device (no bezel frame). Desktop frame toggles
 * stay behind `?tools=1` so the iPhone Safari/home-screen demo looks like the app.
 */
export default function DemoShell({ children }) {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const onOnboarding = pathname === '/onboarding';
  const clockSpeed = useClockSpeed();
  const params = new URLSearchParams(search);
  const embed = params.get('embed') === '1';
  const phoneEmbed = embed && params.get('phone') === '1';
  const compare = pathname.startsWith('/compare');
  const showTools = params.get('tools') === '1';

  const toggleOnboarding = (on) => {
    if (on) {
      navigate('/onboarding');
      return;
    }
    markOnboarded();
    navigate('/', { replace: true });
  };

  if (compare) return children;
  if (embed) {
    return (
      <div className={`stage stage--plain stage--embed ${phoneEmbed ? 'stage--phone' : ''}`}>
        <div className="stage__device">{children}</div>
      </div>
    );
  }

  return (
    <div className="stage stage--plain">
      <div className="stage__device">
        <IPhoneFrame enabled={false}>{children}</IPhoneFrame>
      </div>
      {showTools && (
        <div className="demo-controls demo-controls--floating">
          <DemoToggle
            checked={onOnboarding}
            onChange={toggleOnboarding}
            label="온보딩"
            floating={false}
            compact
          />
          <DemoToggle
            checked={clockSpeed > 1}
            onChange={(on) => setClockSpeed(on ? FAST_SPEED : 1)}
            label={`시간 ×${FAST_SPEED}`}
            floating={false}
            compact
          />
        </div>
      )}
    </div>
  );
}
