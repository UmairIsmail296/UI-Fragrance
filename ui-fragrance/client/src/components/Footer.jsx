import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    // FIXED: Prevent footer from causing horizontal overflow
    <footer className="footer" style={{ overflowX: 'hidden' }}>
      <div className="container footer-grid">
        <div className="footer-brand">
          <h3>
            UI <span>Fragrance</span>
          </h3>
          <p>
            A destination for premium fragrances that leave a lasting
            impression. Discover your signature scent with us.
          </p>
        </div>

        <div className="footer-links">
          <h4>Quick Links</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/shop">Shop</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/track-order">Track Order</Link></li>
          </ul>
        </div>

        <div className="footer-contact">
          <h4>Contact Us</h4>
          <ul>
            <li>WhatsApp: <a href="https://wa.me/923096248054" target="_blank" rel="noopener noreferrer">0309 6248054</a></li>
            <li>Email: hello@uifragrance.com</li>
            <li>Mon - Sat: 10am - 8pm</li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2025 UI Fragrance. All Rights Reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;