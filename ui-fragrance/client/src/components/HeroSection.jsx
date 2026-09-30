import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './HeroSection.css';

const SLIDES = [
  {
    name: 'Aethel',
    sub: 'The Essence of Mystery',
    desc: 'Where midnight woods meet an enigmatic aura — boldly unforgettable.',
    img: 'https://images.pexels.com/photos/36834269/pexels-photo-36834269.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1080&w=1920',
  },
  {
    name: 'Morning Dew',
    sub: 'Nature\'s First Breath',
    desc: 'Dawn-kissed petals on crisp morning air — freshness distilled to perfection.',
    img: 'https://images.pexels.com/photos/6945831/pexels-photo-6945831.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1080&w=1920',
  },
  {
    name: 'Rose Noir',
    sub: 'A Dark Romance',
    desc: 'Opulent rose wrapped in mysterious oud — femininity redefined.',
    img: 'https://images.pexels.com/photos/7814722/pexels-photo-7814722.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1080&w=1920',
  },
];

const MARQUEE_WORDS = [
  'UI PERFUMES', 'AETHEL', 'MORNING DEW', 'ROSE NOIR',
  'HANDCRAFTED', 'EAU DE PARFUM', 'FREE SHIPPING',
  'LUXURY', 'CRUELTY FREE', '50ML EDP',
];

const DURATION = 7000;

export default function HeroSection() {
  const [cur, setCur] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const autoRef = useRef(null);

  const go = useCallback((to) => {
    const target = ((to % SLIDES.length) + SLIDES.length) % SLIDES.length;
    if (target === cur || leaving) return;
    setLeaving(true);
    setTimeout(() => {
      setCur(target);
      setLeaving(false);
    }, 800);
  }, [cur, leaving]);

  const resetAuto = useCallback(() => {
    clearInterval(autoRef.current);
    autoRef.current = setInterval(() => {
      setLeaving(true);
      setTimeout(() => {
        setCur(p => (p + 1) % SLIDES.length);
        setLeaving(false);
      }, 800);
    }, DURATION);
  }, []);

  useEffect(() => { resetAuto(); return () => clearInterval(autoRef.current); }, [resetAuto]);

  const nav = (to) => { go(to); resetAuto(); };

  const s = SLIDES[cur];

  return (
    <>
      <section className={`lx ${leaving ? 'is-leaving' : 'is-entering'}`}>

        {/* ━━━ VIDEO BACKGROUND ━━━ */}
        <div className="lx-video-wrap">
          <video
            className="lx-video"
            src="https://videos.pexels.com/video-files/7815751/7815751-hd_1920_1080_25fps.mp4"
            autoPlay muted loop playsInline
          />
          <div className="lx-video-tint" />
        </div>

        {/* ━━━ FLOATING GOLD PARTICLES (CSS only) ━━━ */}
        <div className="lx-particles" aria-hidden="true">
          {Array.from({ length: 20 }).map((_, i) => (
            <span key={i} className="lx-p" style={{
              '--px': `${Math.random() * 100}%`,
              '--py': `${Math.random() * 100}%`,
              '--s': `${Math.random() * 3 + 1}px`,
              '--d': `${Math.random() * 20 + 10}s`,
              '--del': `${Math.random() * 10}s`,
            }} />
          ))}
        </div>

        {/* ━━━ CENTER CONTENT ━━━ */}
        <div className="lx-center">

          {/* ─ Left: Text side ─ */}
          <div className="lx-txt" key={`txt-${cur}`}>
            <span className="lx-label anim-1">UI PERFUMES · EXCLUSIVE</span>

            <h1 className="lx-name anim-2">
              {s.name.split('').map((c, i) => (
                <span key={i} className="lx-ch" style={{ '--i': i }}>
                  {c === ' ' ? '\u00A0' : c}
                </span>
              ))}
            </h1>

            <p className="lx-sub anim-3">{s.sub}</p>

            <div className="lx-divider anim-4"><span /></div>

            <p className="lx-desc anim-5">{s.desc}</p>

            <div className="lx-btns anim-6">
              <Link to="/shop" className="lx-btn-gold">
                Shop Now
                <svg className="lx-btn-ico" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </Link>
              <Link to="/about" className="lx-btn-line">Our Story</Link>
            </div>
          </div>

          {/* ─ Right: Product image ─ */}
          <div className="lx-showcase" key={`img-${cur}`}>
            <div className="lx-card anim-card">
              <div className="lx-card-glow" />
              <div className="lx-card-inner">
                <img src={s.img} alt={s.name} draggable={false} />
              </div>
              <div className="lx-card-shine" />
              <div className="lx-card-info">
                <small>UI Perfumes</small>
                <strong>{s.name}</strong>
              </div>
              <div className="lx-card-border" />
            </div>
          </div>
        </div>

        {/* ━━━ BOTTOM CONTROLS ━━━ */}
        <div className="lx-bottom">

          {/* Slide indicator pills */}
          <div className="lx-pills">
            {SLIDES.map((sl, i) => (
              <button
                key={i}
                className={`lx-pill${i === cur ? ' active' : ''}`}
                onClick={() => nav(i)}
                aria-label={sl.name}
              >
                <span className="lx-pill-label">{sl.name}</span>
                {i === cur && <span className="lx-pill-progress" key={`prog-${cur}`} />}
              </button>
            ))}
          </div>

          {/* Counter + Arrows */}
          <div className="lx-controls">
            <button className="lx-arrow" onClick={() => nav(cur - 1)} aria-label="Previous">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <div className="lx-count">
              <em key={cur}>{String(cur + 1).padStart(2, '0')}</em>
              <span>/</span>
              <span>{String(SLIDES.length).padStart(2, '0')}</span>
            </div>
            <button className="lx-arrow" onClick={() => nav(cur + 1)} aria-label="Next">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>
            </button>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="lx-scroll-cue">
          <div className="lx-scroll-track"><span /></div>
        </div>
      </section>

      {/* ━━━ MARQUEE ━━━ */}
      <div className="lx-marquee">
        <div className="lx-marquee-rail">
          {[0, 1].map(g => (
            <div className="lx-marquee-set" key={g} aria-hidden={g === 1}>
              {MARQUEE_WORDS.map((w, i) => (
                <React.Fragment key={`${g}${i}`}>
                  <span className="lx-mw">{w}</span>
                  <span className="lx-mdot">✦</span>
                </React.Fragment>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
