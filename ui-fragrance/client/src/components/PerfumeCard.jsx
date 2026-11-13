import React from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useCart } from '../context/CartContext.jsx';
import { resolveAssetUrl } from '../utils/api.js';
import './PerfumeCard.css';

const getPrice = (value) => {
  if (value === null || value === undefined || value === '') return null;

  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
};

const PerfumeCard = ({ perfume, className = '' }) => {
  const { addToCart } = useCart();

  const mainPhoto = perfume.photos?.[0] || perfume.image || '';
  const actualPrice = getPrice(perfume.actualPrice);
  const discountPrice = getPrice(perfume.discountPrice);

  const onSale =
    actualPrice !== null &&
    discountPrice !== null &&
    discountPrice < actualPrice;

  const displayPrice = onSale
    ? discountPrice
    : actualPrice ?? discountPrice;

  const handleQuickAdd = () => {
    addToCart(perfume, 1);
    toast.success(`${perfume.name} added to cart!`);
  };

  return (
    <article className={`perfume-card reveal ${className}`}>
      <Link
        to={`/perfume/${perfume._id}`}
        className="perfume-card__link"
      >
        <div className="perfume-card__image">
          <img
            src={resolveAssetUrl(mainPhoto)}
            alt={perfume.name}
            loading="lazy"
          />

          {onSale && (
            <span className="perfume-card__badge">Sale</span>
          )}
        </div>

        <div className="perfume-card__body">
          {perfume.brand && (
            <p className="perfume-card__brand">{perfume.brand}</p>
          )}

          <h3 className="perfume-card__name">{perfume.name}</h3>

          {perfume.description && (
            <p className="perfume-card__description">
              {perfume.description.length > 80
                ? `${perfume.description.slice(0, 80)}...`
                : perfume.description}
            </p>
          )}

          <div className="perfume-card__details">
            <div className="perfume-card__prices">
              {onSale && (
                <span className="perfume-card__original-price">
                  <span className="perfume-card__sr-only">
                    Original price:
                  </span>{' '}
                  Rs. {actualPrice.toLocaleString('en-PK')}
                </span>
              )}

              <span className="perfume-card__price">
                {displayPrice !== null
                  ? `Rs. ${displayPrice.toLocaleString('en-PK')}`
                  : 'Price unavailable'}
              </span>
            </div>

            {perfume.size && (
              <span className="perfume-card__size">{perfume.size}</span>
            )}
          </div>
        </div>
      </Link>

      <div className="perfume-card__action">
        <button
          type="button"
          className="perfume-card__button"
          onClick={handleQuickAdd}
          aria-label={`Add ${perfume.name} to cart`}
        >
          Add to cart
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 12h16M14 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </article>
  );
};

export default PerfumeCard;