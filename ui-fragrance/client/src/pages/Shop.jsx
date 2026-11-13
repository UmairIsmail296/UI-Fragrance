import React, { useEffect, useState } from 'react';
import PerfumeCard from '../components/PerfumeCard.jsx';
import SEO from '../components/SEO.jsx';
import api from '../utils/api.js';
import useScrollReveal from '../hooks/useScrollReveal.js';
import './Shop.css';

const Shop = () => {
  const [perfumes, setPerfumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchPerfumes = async () => {
      try {
        const { data } = await api.get('/perfumes');
        setPerfumes(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to load perfumes', error);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPerfumes();
  }, []);

  useScrollReveal([loading, searchTerm]);

  const filteredPerfumes = perfumes.filter((perfume) =>
    `${perfume.name || ''} ${perfume.brand || ''}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const handleClearSearch = () => setSearchTerm('');

  return (
    <main className="lux-shop-page">
      <SEO
        title="Shop Luxury & Long Lasting Perfumes in Pakistan | UI Fragrance"
        description="Explore the UI Fragrance collection and shop luxury, long lasting perfumes in Pakistan with nationwide delivery."
        keywords="shop perfumes in Pakistan, long lasting perfumes, luxury perfume collection, UI Fragrance"
        canonical="/shop"
      />
      <section className="lux-shop-header" aria-labelledby="shop-heading">
        <div className="container">
          <span className="shop-badge">UI Fragrance</span>
          <h1 id="shop-heading" className="shop-main-title">
            The Fragrance <span>Collection</span>
          </h1>
          <p className="shop-subtitle">
            Explore our collection and find a fragrance that feels like you.
          </p>
        </div>
      </section>

      <div className="container shop-body-container">
        <div className="shop-controls-bar">
          <div className="shop-search-wrapper">
            <svg
              className="search-lens-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" strokeWidth="1.8" />
              <path
                d="m21 21-4.35-4.35"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>

            <input
              type="text"
              aria-label="Search by perfume name or brand"
              placeholder="Search by name or brand..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              spellCheck="false"
            />

            {searchTerm && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={handleClearSearch}
                aria-label="Clear search"
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>

          {!loading && !loadError && (
            <div className="shop-count-indicator" aria-live="polite">
              Showing <strong>{filteredPerfumes.length}</strong>{' '}
              {filteredPerfumes.length === 1 ? 'fragrance' : 'fragrances'}
            </div>
          )}
        </div>

        {loading ? (
          <div className="shop-loader-wrapper" role="status">
            <div className="shop-gold-spinner" aria-hidden="true" />
            <p>Loading fragrances...</p>
          </div>
        ) : loadError ? (
          <div className="shop-empty-state" role="alert">
            <h2 className="empty-title">Unable to load fragrances</h2>
            <p className="empty-desc">
              Please try again later.
            </p>
          </div>
        ) : filteredPerfumes.length === 0 ? (
          <div className="shop-empty-state">
            <h2 className="empty-title">
              {searchTerm ? 'No fragrances found' : 'No fragrances available'}
            </h2>

            <p className="empty-desc">
              {searchTerm ? (
                <>
                  We couldn’t find a match for <strong>“{searchTerm}”</strong>.
                </>
              ) : (
                'Please check back soon.'
              )}
            </p>

            {searchTerm && (
              <button
                type="button"
                className="btn-clear-search"
                onClick={handleClearSearch}
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="lux-shop-grid">
            {filteredPerfumes.map((perfume) => (
              <div key={perfume._id} className="shop-card-wrapper">
                <PerfumeCard perfume={perfume} />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default Shop;