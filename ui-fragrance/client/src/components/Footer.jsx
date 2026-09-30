import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="lux-footer">
      <div className="lux-footer-top-glow"></div>

      <div className="container">
        <div className="lux-footer-grid">
          
          {/* Column 1: Brand & Socials */}
          <div className="lux-col brand-col">
            <h3 className="lux-brand-title">
              UI <span>FRAGRANCE</span>
            </h3>
            <p className="lux-brand-desc">
              Curating timeless olfactory masterpieces. Every scent is an intimate whisper of prestige, elegance, and distinct individuality.
            </p>
            
            {/* Social Icons: WhatsApp, Instagram, TikTok */}
            <div className="lux-socials">
              {/* WhatsApp */}
              <a 
                href="https://wa.me/923096248054" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="WhatsApp" 
                className="lux-social-btn"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                </svg>
              </a>

              {/* Instagram */}
              <a 
                href="https://www.instagram.com/ui_fragrnace?stkn=MWcwZnc0ZW4yZG95bw%3D%3D&utm_source=qr" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="Instagram" 
                className="lux-social-btn"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                </svg>
              </a>

              {/* TikTok Icon */}
              <a 
                href="https://www.tiktok.com/@ui.fragrance?_r=1&_t=ZS-9A9t2IGEHAL" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="TikTok" 
                className="lux-social-btn"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.47 6.27 6.27 0 0 0 1.96-4.51V8.9a8.18 8.18 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-.96-.33z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Navigation Links */}
          <div className="lux-col links-col">
            <h4 className="lux-col-title">Explore</h4>
            <ul className="lux-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/shop">Fragrance Collection</Link></li>
              <li><Link to="/about">About & Founders</Link></li>
              <li><Link to="/track-order">Track Your Order</Link></li>
            </ul>
          </div>

          {/* Column 3: Direct Concierge & Orders */}
          <div className="lux-col contact-col">
            <h4 className="lux-col-title">Client Care</h4>
            <div className="lux-contact-details">
              <div className="contact-row">
                <span className="contact-label">WhatsApp Order / Support</span>
                <a 
                  href="https://wa.me/923096248054" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="contact-value highlight"
                >
                  +92 309 6248054
                </a>
              </div>

              <div className="contact-row">
                <span className="contact-label">Email Support</span>
                <a href="mailto:hello@uifragrance.com" className="contact-value">
                  hellouifragrance@gmail.com
                </a>
              </div>

              <div className="contact-row">
                <span className="contact-label">Available Hours</span>
                <span className="contact-value muted">Mon – Sun : 08:00 AM – 10:00 PM</span>
              </div>
            </div>
          </div>

        </div>

        {/* Minimal Bottom Bar */}
        <div className="lux-footer-bottom">
          <p className="lux-copy">
            &copy; {new Date().getFullYear()} <strong>UI FRAGRANCE</strong>. All Rights Reserved.
          </p>
          <span className="lux-tagline">Artisanal Luxury Perfumes</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;