import React from 'react';
import { Link } from 'react-router-dom';
import './HeroSection.css';

const HeroSection = () => {
  return (
    // FIXED: constrain hero to avoid horizontal overflow
    <section className="hero" style={{ overflowX: 'hidden' }}>
      <div className="hero-bg" />
      <div className="hero-overlay" />
      <div className="container hero-content" style={{ overflowX: 'hidden' }}>
        <p className="hero-eyebrow reveal visible">UI FRAGRANCE EXCLUSIVE</p>
        <h1 className="hero-title reveal visible">
          Discover Your <span>Signature Scent</span>
        </h1>
        <p className="hero-subtitle reveal visible">
          Handcrafted luxury perfumes made from the world's finest ingredients —
          an olfactory statement for those who define elegance on their own terms.
        </p>
        <div className="hero-actions reveal visible">
          <Link to="/shop" className="btn-gold">
            Shop Collection
          </Link>
          <Link to="/about" className="btn-outline">
            Our Story
          </Link>
        </div>
      </div>
      <div className="hero-scroll-indicator">
        <span></span>
      </div>
    </section>
  );
};

export default HeroSection;