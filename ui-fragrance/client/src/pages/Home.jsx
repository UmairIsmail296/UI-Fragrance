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
        setPerfumes(Array.isArray(data) ? data.slice(0, 5) : []); // FIXED: was slice(0, 6) — now max 5 per spec
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
    <div className="page-fade">
      <HeroSection />

      <section className="featured-section container">
        <h2 className="section-title">
          {/* FIXED: retitled per spec */}
          Featured <span>Collection</span>
        </h2>
        <p className="section-subtitle">
          A curated selection of our most coveted fragrances — each bottle
          crafted for those who appreciate the art of scent.
        </p>

        {loading ? (
          <div className="spinner-wrap">
            <div className="spinner"></div>
          </div>
        ) : perfumes.length === 0 ? (
          <p className="text-center" style={{ color: 'var(--color-text-muted)' }}>
            No perfumes available yet. Please check back soon.
          </p>
        ) : (
          <div className="featured-grid">
            {perfumes.map((perfume) => (
              <PerfumeCard key={perfume._id} perfume={perfume} />
            ))}
          </div>
        )}
      </section>

      <section className="promise-section">
        <div className="container promise-grid">
          <div className="promise-item reveal">
            <h3>100% Authentic</h3>
            <p>Every bottle is crafted with genuine, premium-grade ingredients.</p>
          </div>
          <div className="promise-item reveal">
            <h3>Free Delivery</h3>
            <p>Complimentary delivery on every order, nationwide.</p>
          </div>
          <div className="promise-item reveal">
            <h3>Long Lasting</h3>
            <p>Formulated for exceptional projection and longevity.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;