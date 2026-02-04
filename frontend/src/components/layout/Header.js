import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, ChevronDown, LogIn, UserPlus, Settings, Heart, LogOut } from 'lucide-react';

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const isAuthenticated = false; // TODO: Connect to actual auth state management

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-3xl">🌍</span>
            <span className="text-2xl font-heading font-bold text-primary-600">
              The Travel Atlas
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className="text-neutral-charcoal hover:text-primary-600 font-medium transition-colors"
            >
              Home
            </Link>
            <Link
              to="/designer"
              className="text-neutral-charcoal hover:text-primary-600 font-medium transition-colors"
            >
              Travel Designer
            </Link>
            <Link
              to="/atlas"
              className="text-neutral-charcoal hover:text-primary-600 font-medium transition-colors"
            >
              Atlas Files
            </Link>

            {/* My Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 text-neutral-charcoal hover:text-primary-600 font-medium transition-colors"
              >
                <User size={20} />
                My Profile
                <ChevronDown size={16} className={`transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-neutral-100 py-2 z-50">
                  {isAuthenticated ? (
                    <>
                      <Link
                        to="/profile"
                        className="flex items-center gap-3 px-4 py-3 text-neutral-charcoal hover:bg-neutral-50 transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <User size={18} />
                        Account
                      </Link>
                      <Link
                        to="/designer"
                        className="flex items-center gap-3 px-4 py-3 text-neutral-charcoal hover:bg-neutral-50 transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Heart size={18} />
                        Saved Trips
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center gap-3 px-4 py-3 text-neutral-charcoal hover:bg-neutral-50 transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Settings size={18} />
                        Settings
                      </Link>
                      <div className="border-t border-neutral-100 my-2"></div>
                      <button
                        className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors w-full"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <LogOut size={18} />
                        Log Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        className="flex items-center gap-3 px-4 py-3 text-neutral-charcoal hover:bg-neutral-50 transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <LogIn size={18} />
                        Sign In
                      </Link>
                      <Link
                        to="/register"
                        className="flex items-center gap-3 px-4 py-3 text-neutral-charcoal hover:bg-neutral-50 transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <UserPlus size={18} />
                        Sign Up
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-neutral-charcoal hover:text-primary-600"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-3">
            <Link
              to="/"
              className="block text-neutral-charcoal hover:text-primary-600 font-medium py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/designer"
              className="block text-neutral-charcoal hover:text-primary-600 font-medium py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Travel Designer
            </Link>
            <Link
              to="/atlas"
              className="block text-neutral-charcoal hover:text-primary-600 font-medium py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Atlas Files
            </Link>

            {/* My Profile Section for Mobile */}
            <div className="border-t border-neutral-100 pt-3 mt-3">
              <p className="text-sm text-neutral-warm-gray mb-2 flex items-center gap-2">
                <User size={16} />
                My Profile
              </p>
              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    className="block text-neutral-charcoal hover:text-primary-600 font-medium py-2 pl-6"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Account
                  </Link>
                  <Link
                    to="/designer"
                    className="block text-neutral-charcoal hover:text-primary-600 font-medium py-2 pl-6"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Saved Trips
                  </Link>
                  <button
                    className="block text-red-600 hover:text-red-700 font-medium py-2 pl-6 w-full text-left"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Log Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block text-neutral-charcoal hover:text-primary-600 font-medium py-2 pl-6"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="block text-neutral-charcoal hover:text-primary-600 font-medium py-2 pl-6"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

export default Header;
