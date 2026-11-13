import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import Logo from './Logo.jsx';
import CartIcon from './CartIcon.jsx';
import './Navbar.css';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/shop', label: 'Shop' },
  { to: '/reviews', label: 'Reviews' },
  { to: '/about', label: 'About Us' },
  { to: '/track-order', label: 'Track Order' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const closeButtonRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    const handleResize = () => {
      if (window.innerWidth > 860) setMenuOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [menuOpen]);

  const closeMenu = () => {
    setMenuOpen(false);
    menuButtonRef.current?.focus();
  };

  return (
    <header className={`nb ${scrolled ? 'nb--scrolled' : ''}`}>
      <div className="nb__inner">
        <NavLink to="/" className="nb__brand" aria-label="UI Perfumes home">
          <Logo width={120} height={48} />
        </NavLink>

        <nav className="nb__nav" aria-label="Main navigation">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `nb__link ${isActive ? 'nb__link--active' : ''}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="nb__actions">
          <CartIcon />

          <button
            ref={menuButtonRef}
            type="button"
            className="nb__menu-button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
          >
            <span />
            <span />
          </button>
        </div>
      </div>

      {menuOpen && (
        <>
          <div className="nb__overlay" onClick={closeMenu} />

          <div className="nb__drawer" id="mobile-navigation">
            <div className="nb__drawer-top">
              <span>UI Perfumes</span>

              <button
                ref={closeButtonRef}
                type="button"
                className="nb__close"
                onClick={closeMenu}
                aria-label="Close menu"
              >
                <span />
                <span />
              </button>
            </div>

            <nav className="nb__drawer-nav" aria-label="Mobile navigation">
              {navLinks.map((link, index) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `nb__drawer-link ${
                      isActive ? 'nb__drawer-link--active' : ''
                    }`
                  }
                >
                  <span className="nb__number">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {link.label}
                  <span className="nb__arrow" aria-hidden="true">
                    ↗
                  </span>
                </NavLink>
              ))}
            </nav>

            <p className="nb__drawer-footer">
              A little closer to nature.
            </p>
          </div>
        </>
      )}
    </header>
  );
}