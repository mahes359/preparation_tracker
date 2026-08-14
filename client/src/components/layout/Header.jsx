import { NavLink } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton, SignInButton } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';

const Header = () => {
  const { state } = useApp();
  const { currentStudent } = state;
  const isAdmin = currentStudent?.role === 'ADMIN';
  const groupsReady = !state.loading.groups && !state.loading.sync;
  const isCreator = groupsReady && state.memberships.some((m) => m.role === 'CREATOR' && m.status === 'ACTIVE');
  const notifCount = state.notificationCount || 0;

  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-logo">
          <div className="header-logo-icon">🎯</div>
          <span>Prep Tracker</span>
        </div>

        <nav className="header-nav">
          <SignedIn>
            {groupsReady && isAdmin ? (
              // Admin: only show Admin link, no My Groups
              <NavLink to="/admin" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                Admin
              </NavLink>
            ) : (
              // Regular users
              <NavLink to="/my-groups" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                My Groups
              </NavLink>
            )}

            {groupsReady && (isCreator || isAdmin) && (
              <NavLink
                to="/notifications"
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                style={{ position: 'relative' }}
              >
                🔔
                {notifCount > 0 && (
                  <span style={{
                    position: 'absolute', top: -4, right: -4,
                    background: 'var(--red)', color: '#fff',
                    borderRadius: '99px', fontSize: '0.65rem', fontWeight: 700,
                    padding: '1px 5px', lineHeight: 1.4, minWidth: 16, textAlign: 'center',
                  }}>
                    {notifCount > 9 ? '9+' : notifCount}
                  </span>
                )}
              </NavLink>
            )}
          </SignedIn>

          <SignedOut>
            <NavLink to="/my-groups" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              Home
            </NavLink>
          </SignedOut>
        </nav>

        <div className="flex items-center gap-3">
          <SignedIn>
            {currentStudent && (
              <div className="flex items-center gap-2" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <div className="avatar avatar-sm" style={{ background: currentStudent.avatarColor || '#6c63ff' }}>
                  {currentStudent.initials}
                </div>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {currentStudent.name}
                </span>
              </div>
            )}
            <UserButton appearance={{ elements: { avatarBox: { width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--border-light)' } } }} />
          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal">
              <button className="btn btn-primary btn-sm">Sign In</button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </header>
  );
};

export default Header;
