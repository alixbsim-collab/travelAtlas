import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // TODO: Connect to actual auth

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

            {isAuthenticated ? (
              <Link
                to="/profile"
                className="text-neutral-charcoal hover:text-primary-600 font-medium transition-colors"
              >
                My Profile
              </Link>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-neutral-charcoal hover:text-primary-600 font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-600 transition-colors font-medium"
                >
                  Sign Up
                </Link>
              </div>
            )}
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
            {isAuthenticated ? (
              <Link
                to="/profile"
                className="block text-neutral-charcoal hover:text-primary-600 font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                My Profile
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block text-neutral-charcoal hover:text-primary-600 font-medium py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="block bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-600 transition-colors font-medium text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}

export default Header;
