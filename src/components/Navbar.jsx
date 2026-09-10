import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import Logo from './Logo.jsx';
import CartIcon from './CartIcon.jsx'; // NEW (Change 3)
import './Navbar.css';
// REMOVED: useOrderForm — the "Order Now" drawer has been replaced by the
// Add to Cart → Cart → Checkout flow.

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/shop', label: 'Shop' },
    { to: '/about', label: 'About Us' },
    { to: '/track-order', label: 'Track Order' },
  ];

  return (
    <header className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-inner container">
        <NavLink to="/" className="navbar-brand" onClick={closeMenu}>
          <Logo width={130} height={54} />
        </NavLink>

        <nav className={`navbar-links ${menuOpen ? 'navbar-links-open' : ''}`}>
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `navbar-link ${isActive ? 'navbar-link-active' : ''}`
              }
              onClick={closeMenu}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* NEW: cart icon replaces the old "Order Now" button */}
        <div className="navbar-actions">
          <CartIcon />
          <button
            className={`navbar-hamburger ${menuOpen ? 'navbar-hamburger-open' : ''}`}
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;