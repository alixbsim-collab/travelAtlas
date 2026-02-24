import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, ChevronDown, LogIn, UserPlus, Settings, Heart, LogOut } from 'lucide-react';

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const isAuthenticated = false;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinkClass = "text-white/90 hover:text-naples-400 font-medium transition-colors";

  return (
    <header className="bg-charcoal-500 sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <span
              className="text-naples-400 group-hover:text-naples-300 transition-colors"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: '1.4rem', lineHeight: 1.1, letterSpacing: '-0.01em' }}
            >
              <span style={{ fontSize: '0.75em', display: 'block', fontWeight: 500 }}>The</span>
              <span style={{ fontSize: '1em' }}>Travel Atlas</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className={navLinkClass}>Home</Link>
            <Link to="/designer" className={navLinkClass}>Travel Designer</Link>
            <Link to="/atlas" className={navLinkClass}>Atlas Files</Link>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={`flex items-center gap-2 ${navLinkClass}`}
              >
                <User size={20} />
                My Profile
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`}
                />
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-platinum-200 py-2 z-50"
                  >
                    {isAuthenticated ? (
                      <>
                        <Link
                          to="/profile"
                          className="flex items-center gap-3 px-4 py-3 text-charcoal-500 hover:bg-platinum-50 transition-colors"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <User size={18} /> Account
                        </Link>
                        <Link
                          to="/designer"
                          className="flex items-center gap-3 px-4 py-3 text-charcoal-500 hover:bg-platinum-50 transition-colors"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <Heart size={18} /> Saved Trips
                        </Link>
                        <Link
                          to="/settings"
                          className="flex items-center gap-3 px-4 py-3 text-charcoal-500 hover:bg-platinum-50 transition-colors"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <Settings size={18} /> Settings
                        </Link>
                        <div className="border-t border-platinum-200 my-2" />
                        <button
                          className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors w-full"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <LogOut size={18} /> Log Out
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/login"
                          className="flex items-center gap-3 px-4 py-3 text-charcoal-500 hover:bg-platinum-50 transition-colors"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <LogIn size={18} /> Sign In
                        </Link>
                        <Link
                          to="/register"
                          className="flex items-center gap-3 px-4 py-3 text-charcoal-500 hover:bg-platinum-50 transition-colors"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <UserPlus size={18} /> Sign Up
                        </Link>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-white hover:text-naples-400"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden"
            >
              <div className="mt-4 pb-4 space-y-3">
                <Link to="/" className={`block py-2 ${navLinkClass}`} onClick={() => setIsMenuOpen(false)}>Home</Link>
                <Link to="/designer" className={`block py-2 ${navLinkClass}`} onClick={() => setIsMenuOpen(false)}>Travel Designer</Link>
                <Link to="/atlas" className={`block py-2 ${navLinkClass}`} onClick={() => setIsMenuOpen(false)}>Atlas Files</Link>

                <div className="border-t border-white/20 pt-3 mt-3">
                  <p className="text-sm text-white/60 mb-2 flex items-center gap-2">
                    <User size={16} /> My Profile
                  </p>
                  {isAuthenticated ? (
                    <>
                      <Link to="/profile" className={`block py-2 pl-6 ${navLinkClass}`} onClick={() => setIsMenuOpen(false)}>Account</Link>
                      <Link to="/designer" className={`block py-2 pl-6 ${navLinkClass}`} onClick={() => setIsMenuOpen(false)}>Saved Trips</Link>
                      <button className="block text-red-600 hover:text-red-700 font-medium py-2 pl-6 w-full text-left" onClick={() => setIsMenuOpen(false)}>Log Out</button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" className={`block py-2 pl-6 ${navLinkClass}`} onClick={() => setIsMenuOpen(false)}>Sign In</Link>
                      <Link to="/register" className={`block py-2 pl-6 ${navLinkClass}`} onClick={() => setIsMenuOpen(false)}>Sign Up</Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}

export default Header;
