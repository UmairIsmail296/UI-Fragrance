import React, { useEffect, useState } from 'react';
import HeroSection from '../components/HeroSection.jsx';
import PerfumeCard from '../components/PerfumeCard.jsx';
import api from '../utils/api.js';
import useScrollReveal from '../hooks/useScrollReveal.js';
import './Home.css';

const Home = () => {
  const [perfumes, setPerfumes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerfumes = async () => {
      try {
        const { data } = await api.get('/perfumes');
        setPerfumes(Array.isArray(data) ? data.slice(0, 5) : []);
      } catch (error) {
        console.error('Failed to load perfumes', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPerfumes();
  }, []);

  useScrollReveal([loading]);

  return (
    <div className="lux-home-page page-fade">
      {/* 1. HERO BANNER */}
      <HeroSection />

      {/* 2. FEATURED COLLECTION SECTION */}
      <section className="lux-featured-section">
        <div className="home-ambient-glow top-glow"></div>
        <div className="container">
          
          <div className="featured-section-header text-center">
            <span className="featured-badge">The Signature Selection</span>
            <h2 className="featured-main-title">
              Featured <span>Collection</span>
            </h2>
            <p className="featured-subtitle">
              A meticulously curated collection of our most coveted fragrances — each flacon hand-poured and crafted for those who appreciate the true artistry of scent.
            </p>
          </div>

          {loading ? (
            <div className="lux-home-loader">
              <div className="lux-spinner-ring"></div>
              <p>Gathering Scent Masterpieces...</p>
            </div>
          ) : perfumes.length === 0 ? (
            <div className="lux-home-empty text-center">
              <div className="empty-sparkle">✧</div>
              <p>No perfumes available in the vault yet. Please check back soon.</p>
            </div>
          ) : (
            <div className="lux-featured-grid">
              {perfumes.map((perfume) => (
                <div key={perfume._id} className="lux-card-reveal-wrapper">
                  <PerfumeCard perfume={perfume} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 3. BRAND PROMISE SECTION */}
      <section className="lux-promise-section">
        <div className="home-ambient-glow bottom-glow"></div>
        <div className="container">
          
          <div className="promise-section-header text-center reveal">
            <span className="promise-badge">Our Philosophy</span>
            <h3 className="promise-title">The Standard of <span>Distinction</span></h3>
          </div>

          <div className="lux-promise-grid">
            
            <div className="lux-promise-card reveal">
              <span className="promise-card-icon">✦</span>
              <h4 className="promise-card-title">100% Authentic</h4>
              <p className="promise-card-desc">
                Every luxurious formulation is direct, containing rare essential extracts and pure premium ingredients.
              </p>
            </div>

            <div className="lux-promise-card reveal">
              <span className="promise-card-icon">◈</span>
              <h4 className="promise-card-title">Complimentary Shipping</h4>
              <p className="promise-card-desc">
                We believe in seamless luxury. Benefit from premium secure delivery on every order nationwide.
              </p>
            </div>

            <div className="lux-promise-card reveal">
              <span className="promise-card-icon">✧</span>
              <h4 className="promise-card-title">Enduring Sillage</h4>
              <p className="promise-card-desc">
                Aged to perfection. Crafted for projection and unforgettable, lingering longevity on the skin.
              </p>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;