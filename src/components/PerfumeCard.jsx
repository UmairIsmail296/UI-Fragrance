import React from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useCart } from '../context/CartContext.jsx';
import './PerfumeCard.css';

const resolveImageUrl = (image) => {
  if (!image) return '';
  if (image.startsWith('http')) return image;
  return image; // relative /uploads/... path is proxied by Vite in dev
};

const PerfumeCard = ({ perfume, className = '' }) => {
  const { addToCart } = useCart();

  const mainPhoto = perfume.photos?.[0] || perfume.image || '';

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(perfume, 1);
    toast.success(`${perfume.name} added to cart!`);
  };

  return (
    <Link to={`/perfume/${perfume._id}`} className={`perfume-card reveal ${className}`}>
      <div className="perfume-card-image-wrap">
        <img src={resolveImageUrl(mainPhoto)} alt={perfume.name} loading="lazy" />
        {/* NEW: SALE badge — shown whenever discountPrice is below actualPrice */}
        {perfume.discountPrice < perfume.actualPrice && (
          <span className="perfume-card-sale-badge">SALE</span>
        )}
      </div>
      <div className="perfume-card-body">
        <p className="perfume-card-brand">{perfume.brand}</p>
        <h3 className="perfume-card-name">{perfume.name}</h3>
        <p className="perfume-card-desc">
          {perfume.description?.slice(0, 80)}
          {perfume.description?.length > 80 ? '...' : ''}
        </p>
        <div className="perfume-card-footer">
          {/* FIXED: shows both actualPrice (strikethrough) and
              discountPrice (bold gold) instead of the old single `price` string */}
          <span className="perfume-card-price-group">
            <span className="perfume-card-actual-price">
              Rs. {Number(perfume.actualPrice).toLocaleString('en-PK')}
            </span>
            <span className="perfume-card-discount-price">
              Rs. {Number(perfume.discountPrice).toLocaleString('en-PK')}
            </span>
          </span>
          <span className="perfume-card-size">{perfume.size}</span>
        </div>
        <button type="button" className="perfume-card-add-btn" onClick={handleQuickAdd}>
          <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
            <path d="M7 4h-2l-1 2H2v2h2l3.6 7.59-1.35 2.44A2 2 0 0 0 8 21h12v-2H8l1.1-2h7.45a2 2 0 0 0 1.8-1.11L21.8 8H6.21l-.94-2H7V4zm-1 15a2 2 0 1 0 2 2 2 2 0 0 0-2-2zm10 0a2 2 0 1 0 2 2 2 2 0 0 0-2-2z" />
          </svg>
          Add to Cart
        </button>
      </div>
    </Link>
  );
};

export default PerfumeCard;