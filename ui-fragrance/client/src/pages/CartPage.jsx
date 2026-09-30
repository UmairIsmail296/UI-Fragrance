import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { resolveAssetUrl } from '../utils/api.js';
import { formatPrice, toNumericPrice } from '../utils/price.js';
import './CartPage.css';

const CartPage = () => {
  const { cartItems, removeFromCart, updateQuantity, getTotalPrice } = useCart();
  const navigate = useNavigate();

  // --- EMPTY CART VIEW ---
  if (cartItems.length === 0) {
    return (
      <div className="lux-cart-page">
        <div className="cart-ambient-glow"></div>
        <div className="container">
          <div className="cart-empty-box text-center">
            <div className="empty-cart-vault-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
            </div>
            <span className="cart-empty-tag">Your Vault is Empty</span>
            <h2 className="cart-empty-title">
              No Fragrances <span>Selected</span>
            </h2>
            <p className="cart-empty-desc">
              Your bag is currently empty. Explore our private collection of artisanal blends and find your signature scent today.
            </p>
            <Link to="/shop" className="btn-explore-vault">
              Explore Fragrance Vault →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const subtotal = getTotalPrice();
  const totalItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="lux-cart-page">
      <div className="cart-ambient-glow"></div>

      <div className="container">
        {/* Breadcrumb Navigation */}
        <nav className="lux-cart-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span className="breadcrumb-sep">/</span>
          <Link to="/shop">Collection</Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Shopping Bag</span>
        </nav>

        {/* Page Title & Count Indicator */}
        <div className="cart-header-strip">
          <div>
            <span className="cart-header-sub">Your Selection</span>
            <h1 className="cart-main-heading">
              Fragrance <span>Bag</span>
            </h1>
          </div>
          <div className="cart-count-badge">
            {totalItemCount} {totalItemCount === 1 ? 'Bottle' : 'Bottles'} Reserved
          </div>
        </div>

        {/* 2-Column Cart Layout */}
        <div className="cart-layout-grid">
          
          {/* LEFT: Cart Items List */}
          <div className="cart-items-column">
            {cartItems.map((item) => {
              const unitPrice = toNumericPrice(item.unitPrice);
              const itemSubtotal = unitPrice * item.quantity;

              return (
                <div key={item.perfumeId} className="lux-cart-card">
                  {/* Thumbnail */}
                  <Link to={`/perfume/${item.perfumeId}`} className="cart-item-thumb-wrapper">
                    <img
                      src={resolveAssetUrl(item.mainPhoto)}
                      alt={item.name}
                      className="cart-item-image"
                    />
                  </Link>

                  {/* Details */}
                  <div className="cart-item-body">
                    <div className="cart-item-top-row">
                      <div>
                        <span className="item-category-label">Artisanal Extract</span>
                        <Link to={`/perfume/${item.perfumeId}`} className="cart-item-title-link">
                          {item.name}
                        </Link>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        className="cart-item-remove-btn"
                        onClick={() => removeFromCart(item.perfumeId)}
                        aria-label={`Remove ${item.name} from bag`}
                        title="Remove Item"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>

                    <p className="cart-unit-price-text">{formatPrice(unitPrice)} per bottle</p>

                    <div className="cart-item-bottom-row">
                      {/* Stepper */}
                      <div className="lux-quantity-picker">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.perfumeId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          aria-label="Decrease quantity"
                        >
                          &minus;
                        </button>
                        <span className="picker-qty-val">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.perfumeId, item.quantity + 1)}
                          disabled={item.quantity >= 10}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      {/* Item Subtotal */}
                      <div className="cart-item-subtotal-price">
                        {formatPrice(itemSubtotal)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <Link to="/shop" className="cart-return-shop-link">
              ← Return to Fragrance Collection
            </Link>
          </div>

          {/* RIGHT: Order Summary Card */}
          <div className="cart-summary-column">
            <div className="lux-summary-card">
              <h3 className="summary-title">Order Summary</h3>

              <div className="summary-divider"></div>

              <div className="summary-row">
                <span className="summary-label">Subtotal</span>
                <span className="summary-value">{formatPrice(subtotal)}</span>
              </div>

              <div className="summary-row">
                <span className="summary-label">Reserved Items</span>
                <span className="summary-value">{totalItemCount}</span>
              </div>

              <div className="summary-row">
                <span className="summary-label">Nationwide Shipping</span>
                <span className="summary-value free-delivery-pill">Complimentary</span>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-total-row">
                <span className="total-label">Estimated Total</span>
                <span className="total-value">{formatPrice(subtotal)}</span>
              </div>

              <button
                type="button"
                className="lux-checkout-action-btn"
                onClick={() => navigate('/checkout')}
              >
                Proceed to Checkout
              </button>

              {/* Trust badges */}
              <div className="summary-trust-perks">
                <div className="trust-perk-item">
                  <span className="perk-glyph">✦</span>
                  <p>100% Authentic Artisanal Formulation</p>
                </div>
                <div className="trust-perk-item">
                  <span className="perk-glyph">◈</span>
                  <p>Secure Tamper-Proof VIP Packaging</p>
                </div>
                <div className="trust-perk-item">
                  <span className="perk-glyph">✧</span>
                  <p>Express Dispatch with Tracking</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CartPage;