import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useCart } from '../context/CartContext.jsx';
import { formatPrice, toNumericPrice } from '../utils/price.js';
import { resolveAssetUrl } from '../utils/api.js';
import './CheckoutPage.css';

const initialForm = {
  fullName: '',
  email: '',
  mobile: '',
  city: '',
  area: '',
};

const SHIPPING_FEE = 0;

const CheckoutPage = () => {
  const { cartItems, getTotalPrice } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (cartItems.length === 0) {
      toast.error('Your cart is empty. Add items before checkout.');
      navigate('/cart', { replace: true });
    }
    // Keep the original behavior: check when this page mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'mobile' && value !== '' && !/^[0-9]*$/.test(value)) {
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};

    if (!form.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      newErrors.email = 'Enter a valid email address';
    }

    if (!form.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    }

    if (!form.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!form.area.trim()) {
      newErrors.area = 'Area/Street address is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinueToPayment = (e) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      toast.error('Your cart is empty.');
      navigate('/cart');
      return;
    }

    if (!validate()) return;

    navigate('/payment-confirmation', {
      state: {
        customer: {
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          mobile: form.mobile.trim(),
          city: form.city.trim(),
          area: form.area.trim(),
        },
      },
    });
  };

  if (cartItems.length === 0) return null;

  const subtotal = getTotalPrice();
  const grandTotal = subtotal + SHIPPING_FEE;

  return (
    <main className="checkout-page">
      <div className="container">
        <nav className="checkout-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span className="checkout-breadcrumb-sep" aria-hidden="true">/</span>
          <Link to="/cart">Cart</Link>
          <span className="checkout-breadcrumb-sep" aria-hidden="true">/</span>
          <span className="checkout-breadcrumb-current" aria-current="page">
            Checkout
          </span>
        </nav>

        <header className="checkout-header">
          <span className="checkout-eyebrow">Almost there</span>
          <h1 className="checkout-title">Checkout</h1>
          <p className="checkout-subtitle">
            Enter your delivery details to continue.
          </p>
        </header>

        <div className="checkout-grid">
          <div className="checkout-form-col">
            <div className="checkout-form-card">
              <h2 className="checkout-section-title">Shipping Information</h2>

              <form
                id="checkout-form"
                onSubmit={handleContinueToPayment}
                noValidate
              >
                <div className="checkout-field">
                  <label htmlFor="fullName">Full name *</label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    value={form.fullName}
                    onChange={handleChange}
                    placeholder="Your full name"
                    className={errors.fullName ? 'has-error' : ''}
                    aria-invalid={Boolean(errors.fullName)}
                    aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                    required
                  />
                  {errors.fullName && (
                    <span id="fullName-error" className="checkout-error">
                      {errors.fullName}
                    </span>
                  )}
                </div>

                <div className="checkout-field">
                  <label htmlFor="email">Email address *</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className={errors.email ? 'has-error' : ''}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    required
                  />
                  {errors.email && (
                    <span id="email-error" className="checkout-error">
                      {errors.email}
                    </span>
                  )}
                </div>

                <div className="checkout-field-row">
                  <div className="checkout-field">
                    <label htmlFor="mobile">Mobile number *</label>
                    <input
                      id="mobile"
                      name="mobile"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      value={form.mobile}
                      onChange={handleChange}
                      placeholder="03XXXXXXXXX"
                      className={errors.mobile ? 'has-error' : ''}
                      aria-invalid={Boolean(errors.mobile)}
                      aria-describedby={errors.mobile ? 'mobile-error' : undefined}
                      required
                    />
                    {errors.mobile && (
                      <span id="mobile-error" className="checkout-error">
                        {errors.mobile}
                      </span>
                    )}
                  </div>

                  <div className="checkout-field">
                    <label htmlFor="city">City *</label>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      autoComplete="address-level2"
                      value={form.city}
                      onChange={handleChange}
                      placeholder="Your city"
                      className={errors.city ? 'has-error' : ''}
                      aria-invalid={Boolean(errors.city)}
                      aria-describedby={errors.city ? 'city-error' : undefined}
                      required
                    />
                    {errors.city && (
                      <span id="city-error" className="checkout-error">
                        {errors.city}
                      </span>
                    )}
                  </div>
                </div>

                <div className="checkout-field">
                  <label htmlFor="area">Area / street address *</label>
                  <textarea
                    id="area"
                    name="area"
                    rows={3}
                    autoComplete="street-address"
                    value={form.area}
                    onChange={handleChange}
                    placeholder="House #, street, area"
                    className={errors.area ? 'has-error' : ''}
                    aria-invalid={Boolean(errors.area)}
                    aria-describedby={errors.area ? 'area-error' : undefined}
                    required
                  />
                  {errors.area && (
                    <span id="area-error" className="checkout-error">
                      {errors.area}
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  className="checkout-place-order-btn checkout-place-order-btn-mobile"
                >
                  Continue to payment <span aria-hidden="true">→</span>
                </button>
              </form>
            </div>

            <Link to="/cart" className="checkout-back-link">
              <span aria-hidden="true">←</span> Return to bag
            </Link>
          </div>

          <aside className="checkout-summary-col" aria-label="Order summary">
            <div className="checkout-summary-card">
              <h2 className="checkout-section-title">Order Summary</h2>

              <div className="checkout-summary-items">
                {cartItems.map((item) => {
                  const unitPrice = toNumericPrice(item.unitPrice);
                  const itemSubtotal = unitPrice * item.quantity;

                  return (
                    <div
                      key={item.perfumeId}
                      className="checkout-summary-item"
                    >
                      <img
                        src={resolveAssetUrl(item.mainPhoto)}
                        alt={item.name}
                        className="checkout-summary-thumb"
                      />

                      <div className="checkout-summary-item-info">
                        <p className="checkout-summary-item-name">
                          {item.name}
                        </p>
                        <p className="checkout-summary-item-qty">
                          Quantity: {item.quantity}
                        </p>
                      </div>

                      <p className="checkout-summary-item-price">
                        {formatPrice(itemSubtotal)}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="checkout-divider" />

              <div className="checkout-summary-row">
                <span>Subtotal</span>
                <span className="checkout-summary-row-value">
                  {formatPrice(subtotal)}
                </span>
              </div>

              <div className="checkout-summary-row">
                <span>Shipping</span>
                <span
                  className={
                    SHIPPING_FEE === 0
                      ? 'checkout-summary-row-value checkout-shipping-free'
                      : 'checkout-summary-row-value'
                  }
                >
                  {SHIPPING_FEE === 0 ? 'Free' : formatPrice(SHIPPING_FEE)}
                </span>
              </div>

              <div className="checkout-divider" />

              <div className="checkout-summary-total-row">
                <span>Total</span>
                <span>{formatPrice(grandTotal)}</span>
              </div>

              <button
                type="submit"
                form="checkout-form"
                className="checkout-place-order-btn checkout-place-order-btn-desktop"
              >
                Continue to payment <span aria-hidden="true">→</span>
              </button>

              <p className="checkout-summary-note">
                You can review your payment details on the next step.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default CheckoutPage;