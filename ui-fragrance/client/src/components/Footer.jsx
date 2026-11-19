import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const socialLinks = [
  {
    label: 'WhatsApp',
    href: 'https://wa.me/923096248054',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/ui_fragrnace?stkn=MWcwZnc0ZW4yZG95bw%3D%3D&utm_source=qr',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
  },
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/@ui.fragrance?_r=1&_t=ZS-9A9t2IGEHAL',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.47 6.27 6.27 0 0 0 1.96-4.51V8.9a8.18 8.18 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-.96-.33z" />
      </svg>
    ),
  },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__grid">
          <div className="footer__brand">
            <p className="footer__eyebrow">UI Fragrance</p>
            <h2>
              Scent for
              <br />
              <em>every moment.</em>
            </h2>
            <p className="footer__description">
              Thoughtfully created fragrances for the moments that make you,
              you.
            </p>

            <div className="footer__socials" aria-label="Social media">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${social.label} (opens in a new tab)`}
                  className="footer__social"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          <nav className="footer__column" aria-label="Footer navigation">
            <h3>Explore</h3>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/shop">Fragrance Collection</Link></li>
              <li><Link to="/about">About &amp; Founders</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
              <li><Link to="/faq">Frequently Asked Questions</Link></li>
              <li><Link to="/track-order">Track Your Order</Link></li>
            </ul>
          </nav>

          <div className="footer__column">
            <h3>Client care</h3>
            <div className="footer__contact">
              <div>
                <span>WhatsApp orders &amp; support</span>
                <a
                  href="https://wa.me/923096248054"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  +92 309 6248054
                </a>
              </div>
              <div>
                <span>Email support</span>
                <a href="mailto:hellouifragrance@gmail.com">
                  hellouifragrance@gmail.com
                </a>
              </div>
              <div>
                <span>Available hours</span>
                <p>Mon – Sun: 08:00 AM – 10:00 PM</p>
              </div>
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <p>© {new Date().getFullYear()} UI Fragrance. All rights reserved.</p>
          <span>Made for your everyday.</span>
        </div>
      </div>
    </footer>
  );
}