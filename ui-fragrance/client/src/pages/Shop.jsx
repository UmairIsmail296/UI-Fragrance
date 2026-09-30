import React, { useEffect, useState } from 'react';
import PerfumeCard from '../components/PerfumeCard.jsx';
import api from '../utils/api.js';
import useScrollReveal from '../hooks/useScrollReveal.js';
import './Shop.css';

const Shop = () => {
  const [perfumes, setPerfumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchPerfumes = async () => {
      try {
        const { data } = await api.get('/perfumes');
        setPerfumes(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to load perfumes', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPerfumes();
  }, []);

  useScrollReveal([loading, searchTerm]);

  const filteredPerfumes = perfumes.filter((p) =>
    `${p.name} ${p.brand}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleClearSearch = () => setSearchTerm('');

  return (
    <div className="lux-shop-page page-fade">
      {/* Ambient Top Glow */}
      <div className="shop-ambient-glow"></div>

      {/* --- 1. LUXURY HERO HEADER --- */}
      <div className="lux-shop-header text-center">
        <div className="container">
          <span className="shop-badge">Artisanal Olfactory Catalog</span>
          <h1 className="shop-main-title">
            The Complete <span>Collection</span>
          </h1>
          <p className="shop-subtitle">
            Explore the full UI Fragrance library — every creation a sublime ode to timeless elegance, rare botanicals, and distinct individuality.
          </p>
        </div>
      </div>

      {/* --- 2. SEARCH & BODY CONTAINER --- */}
      <div className="container shop-body-container">
        
        {/* Search & Counter Bar */}
        <div className="shop-controls-bar">
          <div className="shop-search-wrapper">
            <svg className="search-lens-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8" strokeWidth="1.8" />
              <path d="m21 21-4.35-4.35" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Search by perfume name, brand, or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              spellCheck="false"
            />
            {searchTerm && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={handleClearSearch}
                title="Clear Search"
              >
                ✕
              </button>
            )}
          </div>

          {!loading && (
            <div className="shop-count-indicator">
              Showing <strong>{filteredPerfumes.length}</strong> {filteredPerfumes.length === 1 ? 'Masterpiece' : 'Masterpieces'}
            </div>
          )}
        </div>

        {/* --- 3. PRODUCTS GRID & STATES --- */}
        {loading ? (
          <div className="shop-loader-wrapper">
            <div className="shop-gold-spinner"></div>
            <p>Unlocking the Fragrance Vault...</p>
          </div>
        ) : filteredPerfumes.length === 0 ? (
          <div className="shop-empty-state text-center">
            <div className="empty-sparkle">✧</div>
            <h3 className="empty-title">No Fragrances Found</h3>
            <p className="empty-desc">
              We couldn't find any scent matching "<strong>{searchTerm}</strong>".
            </p>
            <button type="button" className="btn-clear-search" onClick={handleClearSearch}>
              Clear Search & View All
            </button>
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
    </div>
  );
};

export default Shop;