import UserMenu from './UserMenu';
import NotificationCentre from './NotificationCentre';
export default function TopBar({ title }) {
  return (
    <header className="top-bar">
      <div className="top-bar-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <img src="/logo-white.png" alt="Camp David Logo" style={{ height: 28, width: 'auto', objectFit: 'contain' }} />
        {title || 'Camp David 2026'}
      </div>
      
      <div className="top-bar-right" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <NotificationCentre />
        <UserMenu lightMode={false} />
      </div>
    </header>
  );
}
