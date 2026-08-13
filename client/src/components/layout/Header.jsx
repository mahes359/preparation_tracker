// src/components/layout/Header.jsx
// Sticky header with logo, nav, and Clerk auth controls.

import { NavLink } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton, SignInButton } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';

const Header = () => {
  const { state } = useApp();
  const { currentStudent } = state;

  return (
    <header className="header">
      <div className="header-inner">
        {/* Logo */}
        <div className="header-logo">
          <div className="header-logo-icon">🎯</div>
          <span>Prep Tracker</span>
        </div>

        {/* Nav */}
        <nav className="header-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/students"
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            Students
          </NavLink>
        </nav>

        {/* Auth */}
        <div className="flex items-center gap-3">
          <SignedIn>
            {/* Show the logged-in student's name */}
            {currentStudent && (
              <div
                className="flex items-center gap-2"
                style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}
              >
                <div
                  className="avatar avatar-sm"
                  style={{ background: currentStudent.avatarColor || '#6c63ff' }}
                >
                  {currentStudent.initials}
                </div>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {currentStudent.name}
                </span>
              </div>
            )}
            {/* Clerk's built-in user button (avatar + dropdown with sign-out) */}
            <UserButton
              appearance={{
                elements: {
                  avatarBox: {
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    border: '2px solid var(--border-light)',
                  },
                },
              }}
            />
          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal">
              <button id="sign-in-btn" className="btn btn-primary btn-sm">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </header>
  );
};

export default Header;
