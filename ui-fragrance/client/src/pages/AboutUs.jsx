import React from 'react';
import useScrollReveal from '../hooks/useScrollReveal.js';
import './AboutUs.css';

// Use images from `public/` (served from root).
const founders = [
  {
    name: 'Muhammad Umair',
    role: 'Muhammad Umair',
    photo: '/IMG_0372.jpg',
  },
  {
    name: 'Ibsham Fayyaz',
    role: 'Ibsham Fayyaz',
    photo: '/3b660f92-733a-4f6b-ade3-c67da2d91837.jpg',
  },
];

const AboutUs = () => {
  useScrollReveal([]);

  return (
    <div className="page-fade about-page">
      <div className="about-hero">
        <div className="container text-center">
          <h1 className="section-title">
            About <span>UI Fragrance</span>
          </h1>
        </div>
      </div>

      <div className="container about-content reveal">
        <p>
          At UI Fragrance, we believe that a fragrance is more than just a
          scent — it is an expression of identity, a whisper of elegance,
          and a statement of sophistication. Our curated collection features
          the finest perfumes crafted from the most exquisite ingredients
          sourced from around the world. Every bottle tells a story, and
          every spray is an experience.
        </p>
        <p>
          Founded with a passion for luxury and an eye for detail, UI
          Fragrance is your destination for premium fragrances that leave a
          lasting impression.
        </p>
      </div>

      <div className="container">
        <h2 className="section-title" style={{ marginTop: '60px' }}>
          Meet the <span>Founders</span>
        </h2>
        <div className="founders-grid">
          {founders.map((founder) => (
            <div key={founder.name} className="founder-card reveal" aria-label={founder.name}>
              <div className="founder-photo-wrap">
                <img src={founder.photo} alt={founder.name} />
              </div>
              <p className="founder-role">{founder.role}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
