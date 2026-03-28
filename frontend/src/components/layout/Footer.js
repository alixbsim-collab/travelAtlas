import { Link } from 'react-router-dom';

const InstagramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const TikTokIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

function Footer() {
  return (
    <footer className="mt-auto bg-charcoal-500">
      <div className="container mx-auto px-6">
        {/* Main footer content */}
        <div className="py-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Brand */}
          <div>
            <span
              className="text-naples-400 inline-block mb-3"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: '1.3rem', lineHeight: 1.1 }}
            >
              <span style={{ fontSize: '0.7em', display: 'block', fontWeight: 500, opacity: 0.85 }}>The</span>
              <span style={{ fontSize: '1em' }}>Travel Atlas</span>
            </span>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs">
              A travel planning tool designed by travellers, for travellers. Plan, explore, and share your adventures.
            </p>
          </div>

          {/* Navigation */}
          <div className="flex flex-col gap-2.5">
            <p className="text-white/30 text-xs uppercase tracking-wider font-medium mb-1">Navigate</p>
            <Link to="/" className="text-white/60 hover:text-naples-400 transition-colors text-sm">Home</Link>
            <Link to="/designer" className="text-white/60 hover:text-naples-400 transition-colors text-sm">Travel Designer</Link>
            <Link to="/atlas" className="text-white/60 hover:text-naples-400 transition-colors text-sm">Atlas Files</Link>
            <Link to="/contact" className="text-white/60 hover:text-naples-400 transition-colors text-sm">Contact</Link>
          </div>

          {/* Social */}
          <div className="flex flex-col gap-3">
            <p className="text-white/30 text-xs uppercase tracking-wider font-medium mb-1">Follow Us</p>
            <div className="flex items-center gap-2.5">
              <a
                href="https://instagram.com/thetravelatlas"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-white/[0.08] hover:bg-naples-400/20 flex items-center justify-center text-white/60 hover:text-naples-400 transition-all"
                aria-label="Instagram"
              >
                <InstagramIcon />
              </a>
              <a
                href="https://tiktok.com/@thetravelatlas"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-white/[0.08] hover:bg-naples-400/20 flex items-center justify-center text-white/60 hover:text-naples-400 transition-all"
                aria-label="TikTok"
              >
                <TikTokIcon />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-5 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/40 text-xs">
            &copy; {new Date().getFullYear()} The Travel Atlas. All rights reserved.
          </p>
          <p className="text-white/30 text-xs">
            Made with care for the travel community
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
