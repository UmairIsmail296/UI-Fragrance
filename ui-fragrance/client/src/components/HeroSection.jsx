import React from 'react';
import { Link } from 'react-router-dom';
import './HeroSection.css';

const fragrances = [
  {
    number: '01',
    name: 'Morning Dew',
    description: 'Fresh & botanical',
    image: '/IMG_E1195.JPG',
    active: true,
  },
  {
    number: '02',
    name: 'Aethel',
    description: 'Deep & mysterious',
    image: '/IMG_E1379.JPG',
  },
  {
    number: '03',
    name: 'Rose Noir',
    description: 'Floral & captivating',
    image: '/IMG_E1385.JPG',
  },
];

function Arrow({ diagonal = false }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {diagonal ? (
        <path d="M7 17 17 7M7 7h10v10" />
      ) : (
        <path d="M4 12h15M13 6l6 6-6 6" />
      )}
    </svg>
  );
}

export default function HeroSection() {
  return (
    <section className="scent-hero" aria-labelledby="hero-title">
      <div className="scent-hero__layout">
        {/* Editorial side */}
        <div className="scent-hero__story">
          <div className="scent-hero__eyebrow">
            <span className="scent-hero__dot" />
            The art of smelling unforgettable
          </div>

          <div className="scent-hero__copy">
            <p className="scent-hero__edition">
              UI Perfumes <span>/</span> No. 01
            </p>

            <h1 id="hero-title">
              A little
              <br />
              closer to
              <br />
              <em>nature.</em>
            </h1>

            <div className="scent-hero__intro">
              <span className="scent-hero__intro-line" />
              <p>
                Meet Morning Dew. A fresh, delicate scent inspired by the
                quiet beauty of a new day.
              </p>
            </div>

            <div className="scent-hero__actions">
              <Link className="scent-hero__button" to="/shop">
                Explore the fragrance
                <span className="scent-hero__button-icon">
                  <Arrow />
                </span>
              </Link>

              <Link className="scent-hero__story-link" to="/about">
                Our story <Arrow diagonal />
              </Link>
            </div>
          </div>

          <div className="scent-hero__story-footer">
            <span>Made to be remembered.</span>
            <span>50 ml / Eau de Parfum</span>
          </div>

          <span className="scent-hero__watermark" aria-hidden="true">
            UI
          </span>
        </div>

        {/* Product side */}
        <div className="scent-hero__product">
          <div className="scent-hero__product-top">
            <span>Featured fragrance</span>
            <span>01 / 03</span>
          </div>

          <div className="scent-hero__showcase">
            <div className="scent-hero__image-frame">
              <img
                src="/IMG_E1195.JPG"
                alt="Morning Dew eau de parfum"
                fetchPriority="high"
              />

              <div className="scent-hero__image-label">
                <span>Introducing</span>
                <strong>Morning Dew</strong>
              </div>
            </div>

            <div className="scent-hero__seal" aria-hidden="true">
              <span>FRESH</span>
              <span className="scent-hero__seal-star">✳</span>
              <span>BY NATURE</span>
            </div>
          </div>

          <div className="scent-hero__product-info">
            <div>
              <p className="scent-hero__label">The scent profile</p>
              <h2>Morning Dew</h2>
              <p className="scent-hero__tagline">
                Nature&apos;s first breath.
              </p>
            </div>

            <Link
              to="/shop"
              className="scent-hero__round-link"
              aria-label="Shop Morning Dew"
            >
              <Arrow diagonal />
            </Link>
          </div>

          <div className="scent-hero__notes">
            <div>
              <span>01 / Top</span>
              <strong>Green Tea</strong>
            </div>
            <div>
              <span>02 / Heart</span>
              <strong>Peony</strong>
            </div>
            <div>
              <span>03 / Base</span>
              <strong>White Musk</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Collection strip */}
      <div className="scent-hero__collection">
        <div className="scent-hero__collection-heading">
          <span>Discover your scent</span>
          <strong>The collection<span>.</span></strong>
        </div>

        <nav
          className="scent-hero__collection-list"
          aria-label="Fragrance collection"
        >
          {fragrances.map((fragrance) => (
            <Link
              key={fragrance.number}
              to="/shop"
              className={`scent-hero__collection-item ${
                fragrance.active ? 'is-active' : ''
              }`}
              aria-label={`${fragrance.name}, ${fragrance.description}${
                fragrance.active ? ', featured fragrance' : ''
              }`}
            >
              <span className="scent-hero__collection-number">
                {fragrance.number}
              </span>

              <img src={fragrance.image} alt="" loading="lazy" />

              <span className="scent-hero__collection-text">
                <strong>{fragrance.name}</strong>
                <small>{fragrance.description}</small>
              </span>

              <span className="scent-hero__collection-arrow">
                <Arrow diagonal />
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}