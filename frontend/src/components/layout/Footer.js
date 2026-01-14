import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="bg-neutral-charcoal text-white mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          {/* Logo and tagline */}
          <div className="mb-4 md:mb-0">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-2xl">🌍</span>
              <span className="text-xl font-heading font-bold">The Travel Atlas</span>
            </div>
            <p className="text-neutral-warm-gray text-sm">
              Plan your perfect adventure
            </p>
          </div>

          {/* Links */}
          <div className="flex space-x-6 text-sm">
            <Link to="/" className="hover:text-accent-400 transition-colors">
              Home
            </Link>
            <Link to="/designer" className="hover:text-accent-400 transition-colors">
              Designer
            </Link>
            <Link to="/atlas" className="hover:text-accent-400 transition-colors">
              Atlas Files
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-gray-700 text-center text-sm text-neutral-warm-gray">
          <p>&copy; {new Date().getFullYear()} The Travel Atlas. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
