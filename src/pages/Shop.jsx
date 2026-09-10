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
        setPerfumes(data);
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

  return (
    <div className="page-fade shop-page">
      <div className="shop-header">
        <div className="container">
          <h1 className="section-title">
            Our <span>Collection</span>
          </h1>
          <p className="section-subtitle" style={{ marginBottom: '0' }}>
            Explore the full UI Fragrance range — each scent a chapter in the
            story of timeless elegance.
          </p>
        </div>
      </div>

      <div className="container shop-body">
        <div className="shop-search">
          <input
            type="text"
            placeholder="Search perfumes by name or brand..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="spinner-wrap">
            <div className="spinner"></div>
          </div>
        ) : filteredPerfumes.length === 0 ? (
          <p className="text-center" style={{ color: 'var(--color-text-muted)', padding: '60px 0' }}>
            No perfumes match your search.
          </p>
        ) : (
          <div className="shop-grid">
            {filteredPerfumes.map((perfume) => (
              // FIXED: PerfumeCard handles card click navigation
              <PerfumeCard key={perfume._id} perfume={perfume} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;