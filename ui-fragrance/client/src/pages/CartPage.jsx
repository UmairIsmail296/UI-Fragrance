import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { resolveAssetUrl } from '../utils/api.js';
import { formatPrice, toNumericPrice } from '../utils/price.js';
import './CartPage.css';

const CartPage = () => {
  const { cartItems, removeFromCart, updateQuantity, getTotalPrice } = useCart();
  const navigate = useNavigate();

  if (cartItems.length === 0) {
    return (
      <main className="lux-cart-page">
        <div className="container">
          <div className="cart-empty-box">
            <div className="empty-cart-vault-icon" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
              >
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>

            <span className="cart-empty-tag">Your shopping bag</span>
            <h1 className="cart-empty-title">Your bag is empty</h1>
            <p className="cart-empty-desc">
              Discover our fragrance collection and find your next favorite.
            </p>

            <Link to="/shop" className="btn-explore-vault">
              Explore the collection <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const subtotal = getTotalPrice();
  const totalItemCount = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return (
    <main className="lux-cart-page">
      <div className="container">
        <nav className="lux-cart-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span className="breadcrumb-sep" aria-hidden="true">/</span>
          <Link to="/shop">Shop</Link>
          <span className="breadcrumb-sep" aria-hidden="true">/</span>
          <span className="breadcrumb-current" aria-current="page">
            Shopping bag
          </span>
        </nav>

        <div className="cart-header-strip">
          <div>
            <span className="cart-header-sub">Your selection</span>
            <h1 className="cart-main-heading">
              Shopping <span>Bag</span>
            </h1>
          </div>

          <div className="cart-count-badge">
            {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
          </div>
        </div>

        <div className="cart-layout-grid">
          <div className="cart-items-column">
            {cartItems.map((item) => {
              const unitPrice = toNumericPrice(item.unitPrice);
              const itemSubtotal = unitPrice * item.quantity;

              return (
                <article key={item.perfumeId} className="lux-cart-card">
                  <Link
                    to={`/perfume/${item.perfumeId}`}
                    className="cart-item-thumb-wrapper"
                    aria-label={`View ${item.name}`}
                  >
                    <img
                      src={resolveAssetUrl(item.mainPhoto)}
                      alt={item.name}
                      className="cart-item-image"
                    />
                  </Link>

                  <div className="cart-item-body">
                    <div className="cart-item-top-row">
                      <div>
                        <span className="item-category-label">Fragrance</span>
                        <Link
                          to={`/perfume/${item.perfumeId}`}
                          className="cart-item-title-link"
                        >
                          {item.name}
                        </Link>
                      </div>

                      <button
                        type="button"
                        className="cart-item-remove-btn"
                        onClick={() => removeFromCart(item.perfumeId)}
                        aria-label={`Remove ${item.name} from bag`}
                        title="Remove item"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          aria-hidden="true"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>

                    <p className="cart-unit-price-text">
                      {formatPrice(unitPrice)} per bottle
                    </p>

                    <div className="cart-item-bottom-row">
                      <div
                        className="lux-quantity-picker"
                        role="group"
                        aria-label={`Quantity for ${item.name}`}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.perfumeId, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
                          aria-label={`Decrease quantity of ${item.name}`}
                        >
                          &minus;
                        </button>

                        <span className="picker-qty-val">{item.quantity}</span>

                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.perfumeId, item.quantity + 1)
                          }
                          disabled={item.quantity >= 10}
                          aria-label={`Increase quantity of ${item.name}`}
                        >
                          +
                        </button>
                      </div>

                      <div className="cart-item-subtotal-price">
                        {formatPrice(itemSubtotal)}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}

            <Link to="/shop" className="cart-return-shop-link">
              <span aria-hidden="true">←</span> Continue shopping
            </Link>
          </div>

          <aside className="cart-summary-column" aria-label="Order summary">
            <div className="lux-summary-card">
              <h2 className="summary-title">Order Summary</h2>
              <div className="summary-divider" />

              <div className="summary-row">
                <span className="summary-label">Subtotal</span>
                <span className="summary-value">{formatPrice(subtotal)}</span>
              </div>

              <div className="summary-row">
                <span className="summary-label">Items</span>
                <span className="summary-value">{totalItemCount}</span>
              </div>

              <div className="summary-row">
                <span className="summary-label">Nationwide shipping</span>
                <span className="summary-value free-delivery-pill">
                  Complimentary
                </span>
              </div>

              <div className="summary-divider" />

              <div className="summary-total-row">
                <span className="total-label">Estimated total</span>
                <span className="total-value">{formatPrice(subtotal)}</span>
              </div>

              <button
                type="button"
                className="lux-checkout-action-btn"
                onClick={() => navigate('/checkout')}
              >
                Proceed to checkout <span aria-hidden="true">→</span>
              </button>

              <p className="summary-note">
                Review your details on the next step.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default CartPage;