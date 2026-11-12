import { Link, useLocation } from 'react-router-dom';
import { CalendarIcon, GearIcon, HomeIcon } from './icons.jsx';
import './BottomNav.css';

const TABS = [
  {
    to: '/',
    label: 'HOME',
    Icon: HomeIcon,
    isActive: (path) => path === '/' || path.startsWith('/plan') || path.startsWith('/pass'),
  },
  { to: '/record', label: 'RECORD', Icon: CalendarIcon, isActive: (path) => path.startsWith('/record') },
  { to: '/my', label: 'MY', Icon: GearIcon, isActive: (path) => path.startsWith('/my') },
];

export default function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="bottom-nav" aria-label="주요 메뉴">
      {TABS.map(({ to, label, Icon, isActive }) => {
        const active = isActive(pathname);
        return (
          <Link
            key={to}
            to={to}
            className={`bottom-nav__item ${active ? 'is-active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={26.7} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
