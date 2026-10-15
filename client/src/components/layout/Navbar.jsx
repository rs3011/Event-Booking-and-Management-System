import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import EventViserLogo from '../common/EventViserLogo';
import Button from '../ui/Button';

const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
  </svg>
);

const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
  </svg>
);

const MonitorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25A2.25 2.25 0 0 1 5.25 3h13.5A2.25 2.25 0 0 1 21 5.25Z" />
  </svg>
);

const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

const ChevronDownIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
);

const navLinkClasses = ({ isActive }) =>
  `px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
    isActive
      ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300 shadow-xs'
      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/80'
  }`;

const mobileNavLinkClasses = ({ isActive }) =>
  `block px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
    isActive
      ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300'
      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800'
  }`;

const Navbar = () => {
  const { user, isAuthenticated, isOrganizer, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const themeIcons = { light: <SunIcon />, dark: <MoonIcon />, system: <MonitorIcon /> };
  const userInitial = user?.name?.charAt(0)?.toUpperCase() || '?';

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center shrink-0" aria-label="EventViser Home">
              <EventViserLogo size="md" />
            </Link>

            {/* Desktop Navigation Links — Role-tailored */}
            <div className="hidden md:flex items-center gap-1.5">
              <NavLink to="/events" className={navLinkClasses}>
                Explore Events
              </NavLink>

              {isAuthenticated && (
                <NavLink to="/tickets" className={navLinkClasses}>
                  My Tickets
                </NavLink>
              )}

              {isOrganizer && (
                <NavLink to="/organizer" className={navLinkClasses}>
                  Organizer Hub
                </NavLink>
              )}

              {isAdmin && (
                <NavLink to="/admin" className={navLinkClasses}>
                  Admin Panel
                </NavLink>
              )}

              <Link
                to="/about"
                className="px-3 py-2 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                How It Works
              </Link>
            </div>

            {/* Right section */}
            <div className="flex items-center gap-2.5">
              {/* Organizer Quick Create Action */}
              {isOrganizer && (
                <Link to="/organizer/events/create" className="hidden sm:inline-flex">
                  <Button size="sm" variant="accent" icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  }>
                    Create Event
                  </Button>
                </Link>
              )}

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
                aria-label={`Current theme: ${theme}. Click to toggle.`}
                title={`Theme: ${theme}`}
              >
                {themeIcons[theme]}
              </button>

              {/* Desktop Auth State */}
              <div className="hidden md:flex items-center gap-2">
                {isAuthenticated ? (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setDropdownOpen((prev) => !prev)}
                      className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                      aria-haspopup="true"
                      aria-expanded={dropdownOpen}
                    >
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover ring-2 ring-primary-500/30" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-700 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                          {userInitial}
                        </div>
                      )}
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 max-w-[130px] truncate">
                        {user?.name}
                      </span>
                      <ChevronDownIcon className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {dropdownOpen && (
                      <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-1">
                        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                          <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
                            {user?.role || 'Attendee'}
                          </span>
                        </div>

                        <div className="py-1">
                          <Link
                            to="/tickets"
                            className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
                          >
                            My Tickets
                          </Link>

                          {isOrganizer && (
                            <>
                              <Link
                                to="/organizer"
                                className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
                              >
                                Organizer Dashboard
                              </Link>
                              <Link
                                to="/organizer/events/create"
                                className="block px-4 py-2 text-sm text-primary-600 dark:text-primary-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold"
                              >
                                + Host New Event
                              </Link>
                            </>
                          )}

                          {isAdmin && (
                            <Link
                              to="/admin"
                              className="block px-4 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold"
                            >
                              Admin Control Center
                            </Link>
                          )}

                          <Link
                            to="/settings"
                            className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
                          >
                            Account Settings
                          </Link>
                        </div>

                        <div className="border-t border-slate-100 dark:border-slate-800 pt-1" />

                        <button
                          onClick={logout}
                          className="w-full text-left px-4 py-2.5 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 transition-colors"
                        >
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link to="/auth/login">
                      <Button variant="ghost" size="sm">
                        Log In
                      </Button>
                    </Link>
                    <Link to="/auth/register">
                      <Button variant="primary" size="sm">
                        Get Started
                      </Button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileOpen((prev) => !prev)}
                className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                aria-label="Toggle navigation menu"
              >
                {mobileOpen ? <XIcon /> : <MenuIcon />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 pt-3 pb-6 space-y-3">
            <div className="space-y-1">
              <NavLink to="/events" className={mobileNavLinkClasses}>
                Explore Campus Events
              </NavLink>
              {isAuthenticated && (
                <NavLink to="/tickets" className={mobileNavLinkClasses}>
                  My Digital Tickets
                </NavLink>
              )}
              {isOrganizer && (
                <>
                  <NavLink to="/organizer" className={mobileNavLinkClasses}>
                    Organizer Dashboard
                  </NavLink>
                  <NavLink to="/organizer/events/create" className={mobileNavLinkClasses}>
                    + Host an Event
                  </NavLink>
                </>
              )}
              {isAdmin && (
                <NavLink to="/admin" className={mobileNavLinkClasses}>
                  Admin Panel
                </NavLink>
              )}
              <NavLink to="/about" className={mobileNavLinkClasses}>
                How It Works
              </NavLink>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
              {isAuthenticated ? (
                <div className="space-y-2">
                  <div className="px-3 py-2 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-sm">
                      {userInitial}
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    </div>
                  </div>
                  <Button variant="danger" size="sm" className="w-full" onClick={logout}>
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link to="/auth/login" className="w-full">
                    <Button variant="secondary" size="md" className="w-full">
                      Log In
                    </Button>
                  </Link>
                  <Link to="/auth/register" className="w-full">
                    <Button variant="primary" size="md" className="w-full">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
