import React from 'react';
import './AboutUs.css';

const founders = [
  {
    name: 'Muhammad Umair',
    role: 'Co-Founder & Creative Director',
    photo: '/IMG_0372.jpg',
    bio: 'Dedicated to the art of olfaction and creating timeless sensory experiences.',
  },
  {
    name: 'Ibsham Fayyaz',
    role: 'Co-Founder & Managing Director',
    photo: '/3b660f92-733a-4f6b-ade3-c67da2d91837.jpg',
    bio: 'Driven by precision, luxury curation, and exceptional craftsmanship.',
  },
];

const values = [
  {
    number: '01',
    title: 'Exquisite Ingredients',
    description:
      'Rare botanicals and premium essential oils handpicked across the globe.',
  },
  {
    number: '02',
    title: 'Master Craftsmanship',
    description:
      'Artisanal blending techniques aged to perfection for enduring sillage.',
  },
  {
    number: '03',
    title: 'Bespoke Elegance',
    description:
      'Each fragrance is an intimate expression of personal identity.',
  },
];

const AboutUs = () => {
  return (
    <main className="about-page">
      {/* Hero */}
      <section className="about-page__hero">
        <div className="about-page__container">
          <p className="about-page__eyebrow">The story behind the scent</p>

          <h1>
            Fragrance is
            <br />
            <em>personal.</em>
          </h1>

          <p className="about-page__hero-description">
            Welcome to UI Fragrance — where timeless perfumery meets modern
            sophistication.
          </p>
        </div>
      </section>

      {/* Our story */}
      <section className="about-page__story">
        <div className="about-page__container about-page__story-grid">
          <div className="about-page__quote">
            <span className="about-page__quote-mark" aria-hidden="true">
              “
            </span>

            <blockquote>
              A fragrance is never just a scent — it is an invisible
              signature, an aura of confidence, and an unforgettable story.
            </blockquote>

            <p>— UI Fragrance philosophy</p>
          </div>

          <div className="about-page__story-copy">
            <p className="about-page__eyebrow">Our heritage</p>

            <h2>A legacy born from passion.</h2>

            <p>
              At <strong>UI Fragrance</strong>, we believe true luxury lies
              in the harmony of notes. Our journey began with a singular
              vision: to curate fragrances that transcend the ordinary and
              resonate with your soul.
            </p>

            <p>
              From hand-selected French blossoms to aged Middle Eastern oud,
              every droplet in our collection is precision-crafted. We invite
              you into a world where your presence is felt long before you
              speak.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="about-page__values">
        <div className="about-page__container">
          <div className="about-page__section-heading">
            <div>
              <p className="about-page__eyebrow">What guides us</p>
              <h2>Our values<span>.</span></h2>
            </div>

            <p>Thoughtful details make a lasting impression.</p>
          </div>

          <div className="about-page__values-grid">
            {values.map((value) => (
              <article className="about-page__value" key={value.number}>
                <span className="about-page__value-number">
                  {value.number}
                </span>

                <h3>{value.title}</h3>
                <p>{value.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Founders */}
      <section className="about-page__founders">
        <div className="about-page__container">
          <div className="about-page__founders-heading">
            <p className="about-page__eyebrow">The people behind UI</p>

            <h2>Meet the founders<span>.</span></h2>

            <p>
              The creative minds and passion behind every signature scent of
              UI Fragrance.
            </p>
          </div>

          <div className="about-page__founders-grid">
            {founders.map((founder) => (
              <article className="about-page__founder" key={founder.name}>
                <div className="about-page__founder-image">
                  <img
                    src={founder.photo}
                    alt={founder.name}
                    loading="lazy"
                  />
                </div>

                <div className="about-page__founder-info">
                  <p className="about-page__founder-role">{founder.role}</p>
                  <h3>{founder.name}</h3>
                  <p className="about-page__founder-bio">{founder.bio}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default AboutUs;