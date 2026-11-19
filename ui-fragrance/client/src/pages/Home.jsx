import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import HeroSection from '../components/HeroSection.jsx';
import PerfumeCard from '../components/PerfumeCard.jsx';
import FAQSection from '../components/FAQSection.jsx';
import SEO from '../components/SEO.jsx';
import api from '../utils/api.js';
import useScrollReveal from '../hooks/useScrollReveal.js';
import './Home.css';

const Home = () => {
  const [perfumes, setPerfumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const fetchPerfumes = async () => {
      try {
        const { data } = await api.get('/perfumes');
        setPerfumes(Array.isArray(data) ? data.slice(0, 5) : []);
      } catch (error) {
        console.error('Failed to load perfumes', error);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPerfumes();
  }, []);

  useScrollReveal([loading]);

  return (
    <main className="lux-home-page page-fade">
      <SEO
        canonical="/"
        keywords="perfumes in Pakistan, long lasting perfumes in Pakistan, luxury perfumes in Pakistan, UI Fragrance"
      />
      <HeroSection />

      <section
        className="lux-featured-section"
        aria-labelledby="featured-heading"
      >
        <div className="container">
          <div className="featured-section-header">
            <span className="featured-badge">Discover your scent</span>
            <h2 id="featured-heading" className="featured-main-title">
              Featured <span>Collection</span>
            </h2>
            <p className="featured-subtitle">
              Explore a selection of fragrances and find one that feels like
              you.
            </p>
          </div>

          {loading ? (
            <div className="lux-home-loader" role="status">
              <div className="lux-spinner-ring" aria-hidden="true" />
              <p>Loading fragrances...</p>
            </div>
          ) : loadError ? (
            <div className="lux-home-empty" role="alert">
              <p>We couldn’t load the fragrances. Please try again later.</p>
            </div>
          ) : perfumes.length === 0 ? (
            <div className="lux-home-empty">
              <p>No perfumes are available right now. Please check back soon.</p>
            </div>
          ) : (
            <>
              <div className="lux-featured-grid">
                {perfumes.map((perfume) => (
                  <div key={perfume._id} className="lux-card-reveal-wrapper">
                    <PerfumeCard perfume={perfume} />
                  </div>
                ))}
              </div>

              <div className="featured-action">
                <Link to="/shop" className="featured-shop-link">
                  View all fragrances <span aria-hidden="true">→</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      <section
        className="lux-promise-section"
        aria-labelledby="promise-heading"
      >
        <div className="container">
          <div className="promise-section-header reveal">
            <span className="promise-badge">UI Fragrance</span>
            <h2 id="promise-heading" className="promise-title">
              Discover More With <span>Us</span>
            </h2>
          </div>

          <div className="lux-promise-grid">
            <div className="lux-promise-card reveal">
              <span className="promise-card-icon" aria-hidden="true">✦</span>
              <h3 className="promise-card-title">Explore the Collection</h3>
              <p className="promise-card-desc">
                Browse our fragrances and find a scent for your collection.
              </p>
              <Link to="/shop" className="promise-card-link">
                Shop fragrances <span aria-hidden="true">→</span>
              </Link>
            </div>

            <div className="lux-promise-card reveal">
              <span className="promise-card-icon" aria-hidden="true">◈</span>
              <h3 className="promise-card-title">Track Your Order</h3>
              <p className="promise-card-desc">
                Check your order status using your tracking ID.
              </p>
              <Link to="/track-order" className="promise-card-link">
                Track an order <span aria-hidden="true">→</span>
              </Link>
            </div>

            <div className="lux-promise-card reveal">
              <span className="promise-card-icon" aria-hidden="true">✧</span>
              <h3 className="promise-card-title">Customer Reviews</h3>
              <p className="promise-card-desc">
                Read experiences shared by other fragrance lovers.
              </p>
              <Link to="/reviews" className="promise-card-link">
                Read reviews <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
      <FAQSection />
    </main>
  );
};

export default Home;