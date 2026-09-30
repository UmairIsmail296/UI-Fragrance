import React from 'react';
import useScrollReveal from '../hooks/useScrollReveal.js';
import './AboutUs.css';

const founders = [
  {
    name: 'Muhammad Umair',
    role: 'Co-Founder & Creative Director',
    photo: '/IMG_0372.jpg',
    bio: 'Dedicated to the art of olfaction and creating timeless sensory experiences.'
  },
  {
    name: 'Ibsham Fayyaz',
    role: 'Co-Founder & Managing Director',
    photo: '/3b660f92-733a-4f6b-ade3-c67da2d91837.jpg',
    bio: 'Driven by precision, luxury curation, and exceptional craftsmanship.'
  },
];

const values = [
  {
    icon: '✦',
    title: 'Exquisite Ingredients',
    desc: 'Rare botanicals and premium essential oils handpicked across the globe.'
  },
  {
    icon: '◈',
    title: 'Master Craftsmanship',
    desc: 'Artisanal blending techniques aged to perfection for enduring sillage.'
  },
  {
    icon: '✧',
    title: 'Bespoke Elegance',
    desc: 'Each fragrance is an intimate whisper of personal identity and prestige.'
  }
];

const AboutUs = () => {
  useScrollReveal([]);

  return (
    <div className="about-page">
      {/* --- HERO SECTION --- */}
      <section className="about-hero">
        <div className="hero-ambient-glow"></div>
        <div className="container hero-container text-center">
          <span className="hero-badge">The Essence of Elegance</span>
          <h1 className="hero-title">
            Crafting Memories Through <span>Pure Scent</span>
          </h1>
          <p className="hero-subtitle">
            Welcome to UI Fragrance — where timeless perfumery meets modern sophistication.
          </p>
        </div>
      </section>

      {/* --- STORY & STATS SECTION --- */}
      <section className="about-story-section">
        <div className="container">
          <div className="story-grid">
            <div className="story-quote-card reveal">
              <span className="quote-mark">“</span>
              <p className="quote-text">
                A fragrance is never just a scent — it is an invisible signature, an aura of confidence, and an unforgettable story.
              </p>
              <div className="quote-signature">— UI FRAGRANCE PHILOSOPHY</div>

              <div className="stats-row">
                <div className="stat-item">
                  <h3>100%</h3>
                  <span>Authentic Extracts</span>
                </div>
                <div className="stat-item">
                  <h3>50+</h3>
                  <span>Artisanal Blends</span>
                </div>
                <div className="stat-item">
                  <h3>24h+</h3>
                  <span>Lasting Sillage</span>
                </div>
              </div>
            </div>

            <div className="story-content reveal">
              <span className="section-subtitle">Our Heritage</span>
              <h2 className="section-heading">A Legacy Born from Pure Passion</h2>
              <p>
                At <strong>UI Fragrance</strong>, we believe true luxury lies in the harmony of notes. Our journey began with a singular vision: to curate fragrances that transcend the ordinary and resonate with your soul.
              </p>
              <p>
                From hand-selected French blossoms to aged Middle Eastern oud, every droplet in our collection is precision-crafted. We invite you into a world of curated exclusivity where your presence is felt long before you speak.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- VALUES PILLARS --- */}
      <section className="about-values-section">
        <div className="container">
          <div className="text-center section-header reveal">
            <span className="section-subtitle">The Pillars</span>
            <h2 className="section-heading">Our Core <span>Values</span></h2>
          </div>

          <div className="values-grid">
            {values.map((val, index) => (
              <div key={index} className="value-card reveal">
                <div className="value-icon">{val.icon}</div>
                <h3 className="value-title">{val.title}</h3>
                <p className="value-desc">{val.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FOUNDERS SECTION --- */}
      <section className="founders-section">
        <div className="container">
          <div className="text-center section-header reveal">
            <span className="section-subtitle">The Visionaries</span>
            <h2 className="section-heading">Meet The <span>Founders</span></h2>
            <p className="founders-intro">
              The creative minds and passion behind every signature scent of UI Fragrance.
            </p>
          </div>

          <div className="founders-grid">
            {founders.map((founder) => (
              <div key={founder.name} className="founder-card reveal" aria-label={founder.name}>
                <div className="founder-image-wrapper">
                  <img src={founder.photo} alt={founder.name} />
                  <div className="founder-overlay"></div>
                </div>
                <div className="founder-info">
                  <h3 className="founder-name">{founder.name}</h3>
                  <p className="founder-role">{founder.role}</p>
                  <p className="founder-bio">{founder.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;