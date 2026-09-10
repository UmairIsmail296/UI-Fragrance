import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../utils/api.js';
import { useCart } from '../context/CartContext.jsx';
import './PerfumeDetail.css';

const resolveImageUrl = (image) => {
  if (!image) return '';
  if (image.startsWith('http')) return image;
  return image;
};

const PerfumeDetail = () => {
  const { id } = useParams();
  const [perfume, setPerfume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchPerfume = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get(`/perfumes/${id}`);
        setPerfume(data);
        setActiveMediaIndex(0);
        setQuantity(1);
        setJustAdded(false);
      } catch (err) {
        setError('Perfume not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchPerfume();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) {
    return (
      <div className="spinner-wrap" style={{ minHeight: '60vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (error || !perfume) {
    return (
      <div className="container text-center" style={{ padding: '100px 0' }}>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '20px' }}>{error}</p>
        <Link to="/shop" className="btn-outline">Back to Shop</Link>
      </div>
    );
  }

  const photos = perfume.photos?.length ? perfume.photos : perfume.image ? [perfume.image] : [];
  const videos = perfume.videos || [];

  // Unified gallery — photo thumbnails and video thumbnails live in the
  // SAME strip, and left/right arrows cycle through all of them together.
  // Clicking a video thumbnail swaps the main display area to a playable
  // <video> instead of an <img>.
  const media = [
    ...photos.map((src) => ({ type: 'photo', src })),
    ...videos.map((src) => ({ type: 'video', src })),
  ];
  const activeMedia = media[activeMediaIndex] || media[0];

  const goToPrevMedia = () => {
    setActiveMediaIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
  };

  const goToNextMedia = () => {
    setActiveMediaIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
  };

  const decrementQuantity = () => setQuantity((q) => Math.max(1, q - 1));
  const incrementQuantity = () => setQuantity((q) => Math.min(10, q + 1));

  const handleAddToCart = () => {
    addToCart(perfume, quantity);
    toast.success('Added to cart!');
    setJustAdded(true);
  };

  const isOnSale = perfume.discountPrice < perfume.actualPrice;

  return (
    <div className="page-fade perfume-detail">
      <div className="container">
        <Link to="/shop" className="detail-back-link">
          &larr; Back to Shop
        </Link>

        <div className="detail-grid">
          {/* LEFT: unified photo + video gallery */}
          <div className="detail-gallery">
            <div className="detail-main-media-wrap">
              {media.length > 1 && (
                <button
                  type="button"
                  className="gallery-arrow gallery-arrow-left"
                  onClick={goToPrevMedia}
                  aria-label="Previous media"
                >
                  &#8249;
                </button>
              )}

              {activeMedia?.type === 'video' ? (
                <video
                  key={activeMediaIndex}
                  src={resolveImageUrl(activeMedia.src)}
                  controls
                  preload="metadata"
                  className="detail-main-video"
                />
              ) : (
                <img
                  key={activeMediaIndex}
                  src={resolveImageUrl(activeMedia?.src)}
                  alt={`${perfume.name} — media ${activeMediaIndex + 1}`}
                  className="detail-main-image"
                />
              )}

              {media.length > 1 && (
                <button
                  type="button"
                  className="gallery-arrow gallery-arrow-right"
                  onClick={goToNextMedia}
                  aria-label="Next media"
                >
                  &#8250;
                </button>
              )}
            </div>

            {media.length > 1 && (
              <div className="detail-thumbnail-strip">
                {media.map((item, index) => (
                  <button
                    type="button"
                    key={item.src + index}
                    className={`detail-thumbnail ${index === activeMediaIndex ? 'active' : ''}`}
                    onClick={() => setActiveMediaIndex(index)}
                    aria-label={item.type === 'video' ? `Play video ${index + 1}` : `View photo ${index + 1}`}
                  >
                    {item.type === 'video' ? (
                      <>
                        <video src={resolveImageUrl(item.src)} muted />
                        <span className="detail-thumbnail-play-icon">
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </span>
                      </>
                    ) : (
                      <img src={resolveImageUrl(item.src)} alt={`${perfume.name} thumbnail ${index + 1}`} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: info panel */}
          <div className="detail-info">
            <p className="detail-brand">{perfume.brand}</p>
            <h1 className="detail-name">{perfume.name}</h1>

            <div className="detail-price-row">
              <span className="detail-actual-price">
                Rs. {Number(perfume.actualPrice).toLocaleString('en-PK')}
              </span>
              <span className="detail-discount-price">
                Rs. {Number(perfume.discountPrice).toLocaleString('en-PK')}
              </span>
              {isOnSale && <span className="detail-sale-badge">SALE</span>}
            </div>

            <span className="detail-size-badge">{perfume.size}</span>

            <p className="detail-description">{perfume.description}</p>

            <div className="detail-notes">
              <div className="note-block">
                <h4>Top Notes</h4>
                <p>{perfume.topNotes}</p>
              </div>
              <div className="note-block">
                <h4>Middle Notes</h4>
                <p>{perfume.middleNotes}</p>
              </div>
              <div className="note-block">
                <h4>Base Notes</h4>
                <p>{perfume.baseNotes}</p>
              </div>
            </div>

            <div className="detail-quantity-row">
              <label>Quantity</label>
              <div className="quantity-stepper">
                <button
                  type="button"
                  className="quantity-btn"
                  onClick={decrementQuantity}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  &minus;
                </button>
                <span className="detail-quantity-value">{quantity}</span>
                <button
                  type="button"
                  className="quantity-btn"
                  onClick={incrementQuantity}
                  disabled={quantity >= 10}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>

            <button className="btn-gold detail-order-btn" onClick={handleAddToCart}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style={{ marginRight: 8, verticalAlign: '-4px' }}>
                <path d="M7 4h-2l-1 2H2v2h2l3.6 7.59-1.35 2.44A2 2 0 0 0 8 21h12v-2H8l1.1-2h7.45a2 2 0 0 0 1.8-1.11L21.8 8H6.21l-.94-2H7V4zm-1 15a2 2 0 1 0 2 2 2 2 0 0 0-2-2zm10 0a2 2 0 1 0 2 2 2 2 0 0 0-2-2z" />
              </svg>
              Add to Cart
            </button>

            {justAdded && (
              <Link to="/cart" className="detail-view-cart-link">
                View Cart &rarr;
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerfumeDetail;