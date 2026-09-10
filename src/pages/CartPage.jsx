import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { formatPrice, toNumericPrice } from '../utils/price.js';
import './CartPage.css';

const resolveImageUrl = (image) => {
  if (!image) return '';
  if (image.startsWith('http')) return image;
  return image;
};

const CartPage = () => {
  const { cartItems, removeFromCart, updateQuantity, getTotalPrice } = useCart();
  const navigate = useNavigate();

  if (cartItems.length === 0) {
    return (
      <div className="cart-page">
        <div className="container cart-empty">
          <div className="cart-empty-icon">
            <svg viewBox="0 0 24 24" width="56" height="56" fill="currentColor">
              <path d="M7 4h-2l-1 2H2v2h2l3.6 7.59-1.35 2.44A2 2 0 0 0 8 21h12v-2H8l1.1-2h7.45a2 2 0 0 0 1.8-1.11L21.8 8H6.21l-.94-2H7V4zm-1 15a2 2 0 1 0 2 2 2 2 0 0 0-2-2zm10 0a2 2 0 1 0 2 2 2 2 0 0 0-2-2z" />
            </svg>
          </div>
          <h2 className="section-title">
            Your Cart is <span>Empty</span>
          </h2>
          <p className="section-subtitle">
            Looks like you haven't added any fragrances yet.
          </p>
          <Link to="/shop" className="btn-gold">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const subtotal = getTotalPrice();

  return (
    <div className="cart-page">
      <div className="container">
        {/* Breadcrumb — matches CheckoutPage for a consistent funnel feel */}
        <nav className="cart-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span className="cart-breadcrumb-sep">&gt;</span>
          <span className="cart-breadcrumb-current">Cart</span>
        </nav>

        <h1 className="cart-title">Your Cart</h1>
        <p className="cart-item-count">
          {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
        </p>

        <div className="cart-grid">
          {/* LEFT: item cards */}
          <div className="cart-items-col">
            {cartItems.map((item) => {
              const unitPrice = toNumericPrice(item.unitPrice);
              const itemSubtotal = unitPrice * item.quantity;

              return (
                <div key={item.perfumeId} className="cart-item-card">
                  <img
                    src={resolveImageUrl(item.mainPhoto)}
                    alt={item.name}
                    className="cart-item-thumb"
                  />

                  <div className="cart-item-details">
                    <div className="cart-item-top">
                      <Link to={`/perfume/${item.perfumeId}`} className="cart-item-name">
                        {item.name}
                      </Link>
                      <button
                        className="cart-item-remove"
                        onClick={() => removeFromCart(item.perfumeId)}
                        aria-label={`Remove ${item.name} from cart`}
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                          <path d="M9 3a1 1 0 0 0-1 1v1H4a1 1 0 1 0 0 2h1v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7h1a1 1 0 1 0 0-2h-4V4a1 1 0 0 0-1-1H9zm-2 4h10v13H7V7zm3 2a1 1 0 0 0-1 1v7a1 1 0 1 0 2 0v-7a1 1 0 0 0-1-1zm4 0a1 1 0 0 0-1 1v7a1 1 0 1 0 2 0v-7a1 1 0 0 0-1-1z" />
                        </svg>
                      </button>
                    </div>

                    <p className="cart-item-unit-price">{formatPrice(unitPrice)} each</p>

                    <div className="cart-item-bottom">
                      <div className="cart-quantity-stepper">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.perfumeId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          aria-label="Decrease quantity"
                        >
                          &minus;
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.perfumeId, item.quantity + 1)}
                          disabled={item.quantity >= 10}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <p className="cart-item-subtotal">{formatPrice(itemSubtotal)}</p>
                    </div>
                  </div>
                </div>
              );
            })}

            <Link to="/shop" className="cart-continue-link">
              &larr; Continue Shopping
            </Link>
          </div>

          {/* RIGHT: sticky Order Summary — same visual language as Checkout */}
          <div className="cart-summary-col">
            <div className="cart-summary-card">
              <h2 className="cart-summary-title">Order Summary</h2>

              <div className="cart-divider" />

              <div className="cart-summary-row">
                <span>Subtotal</span>
                <span className="cart-summary-row-value">{formatPrice(subtotal)}</span>
              </div>
              <div className="cart-summary-row">
                <span>Items</span>
                <span className="cart-summary-row-value">
                  {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>

              <div className="cart-divider" />

              <div className="cart-summary-total-row">
                <span>Total</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              <button className="cart-checkout-btn" onClick={() => navigate('/checkout')}>
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;