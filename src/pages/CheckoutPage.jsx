import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useCart } from '../context/CartContext.jsx';
import { formatPrice, toNumericPrice } from '../utils/price.js'; // FIXED: shared price helpers
import api from '../utils/api.js';
import './CheckoutPage.css';

const initialForm = {
  fullName: '',
  email: '',
  mobile: '',
  city: '',
  area: '',
};

// No online payment / COD split exists in this build, so shipping is a
// simple flat constant — set to a number (e.g. 100) instead of 0 if you
// want a delivery charge applied to every order.
const SHIPPING_FEE = 0;

const resolveImageUrl = (image) => {
  if (!image) return '';
  if (image.startsWith('http')) return image;
  return image;
};

const CheckoutPage = () => {
  const { cartItems, getTotalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Redirect to /cart if the cart is empty (e.g. direct navigation to /checkout)
  useEffect(() => {
    if (cartItems.length === 0) {
      toast.error('Your cart is empty. Add items before checkout.');
      navigate('/cart', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'mobile' && value !== '' && !/^[0-9]*$/.test(value)) return;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      newErrors.email = 'Enter a valid email address';
    }
    if (!form.mobile.trim()) newErrors.mobile = 'Mobile number is required';
    if (!form.city.trim()) newErrors.city = 'City is required';
    if (!form.area.trim()) newErrors.area = 'Area/Street address is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      toast.error('Your cart is empty.');
      navigate('/cart');
      return;
    }
    if (!validate()) return;

    setSubmitting(true);
    try {
      const { data } = await api.post('/orders', {
        customerName: form.fullName,
        customerEmail: form.email,
        customerMobile: form.mobile,
        customerCity: form.city,
        customerArea: form.area,
        items: cartItems.map((item) => ({
          perfumeId: item.perfumeId,
          quantity: item.quantity,
        })),
      });

      clearCart();
      navigate('/order-success', { state: { orderId: data.order.orderId } });
    } catch (error) {
      const message = error.response?.data?.message || 'Something went wrong. Please try again.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (cartItems.length === 0) return null; // redirect effect handles this

  // FIXED: subtotal always derived from the shared, hardened price helper
  const subtotal = getTotalPrice();
  const grandTotal = subtotal + SHIPPING_FEE;

  return (
    <div className="checkout-page">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="checkout-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span className="checkout-breadcrumb-sep">&gt;</span>
          <Link to="/cart">Cart</Link>
          <span className="checkout-breadcrumb-sep">&gt;</span>
          <span className="checkout-breadcrumb-current">Checkout</span>
        </nav>

        <h1 className="checkout-title">Checkout</h1>

        <div className="checkout-grid">
          {/* LEFT: Shipping Information form */}
          <div className="checkout-form-col">
            <div className="checkout-form-card">
              <h2 className="checkout-section-title">Shipping Information</h2>

              <form onSubmit={handleSubmit} noValidate>
                <div className="checkout-field">
                  <label htmlFor="fullName">Full Name *</label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={form.fullName}
                    onChange={handleChange}
                    placeholder="Your full name"
                    className={errors.fullName ? 'has-error' : ''}
                  />
                  {errors.fullName && <span className="checkout-error">{errors.fullName}</span>}
                </div>

                <div className="checkout-field">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className={errors.email ? 'has-error' : ''}
                  />
                  {errors.email && <span className="checkout-error">{errors.email}</span>}
                </div>

                <div className="checkout-field-row">
                  <div className="checkout-field">
                    <label htmlFor="mobile">Mobile Number *</label>
                    <input
                      id="mobile"
                      name="mobile"
                      type="tel"
                      inputMode="numeric"
                      value={form.mobile}
                      onChange={handleChange}
                      placeholder="03XXXXXXXXX"
                      className={errors.mobile ? 'has-error' : ''}
                    />
                    {errors.mobile && <span className="checkout-error">{errors.mobile}</span>}
                  </div>

                  <div className="checkout-field">
                    <label htmlFor="city">City *</label>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      value={form.city}
                      onChange={handleChange}
                      placeholder="Your city"
                      className={errors.city ? 'has-error' : ''}
                    />
                    {errors.city && <span className="checkout-error">{errors.city}</span>}
                  </div>
                </div>

                <div className="checkout-field">
                  <label htmlFor="area">Area / Street Address *</label>
                  <textarea
                    id="area"
                    name="area"
                    rows={3}
                    value={form.area}
                    onChange={handleChange}
                    placeholder="House #, Street, Area"
                    className={errors.area ? 'has-error' : ''}
                  />
                  {errors.area && <span className="checkout-error">{errors.area}</span>}
                </div>

                {/* Place Order button also appears here for the mobile
                    single-column layout (order summary already has its own
                    copy for desktop — see CSS for which one shows where) */}
                <button
                  type="submit"
                  className="checkout-place-order-btn checkout-place-order-btn-mobile"
                  disabled={submitting}
                >
                  {submitting ? <span className="spinner small"></span> : 'Place Order'}
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT: sticky Order Summary card */}
          <div className="checkout-summary-col">
            <div className="checkout-summary-card">
              <h2 className="checkout-section-title">Order Summary</h2>

              <div className="checkout-summary-items">
                {cartItems.map((item) => {
                  const unitPrice = toNumericPrice(item.unitPrice);
                  const itemSubtotal = unitPrice * item.quantity;
                  return (
                    <div key={item.perfumeId} className="checkout-summary-item">
                      <img
                        src={resolveImageUrl(item.mainPhoto)}
                        alt={item.name}
                        className="checkout-summary-thumb"
                      />
                      <div className="checkout-summary-item-info">
                        <p className="checkout-summary-item-name">{item.name}</p>
                        <p className="checkout-summary-item-qty">× {item.quantity}</p>
                      </div>
                      <p className="checkout-summary-item-price">{formatPrice(itemSubtotal)}</p>
                    </div>
                  );
                })}
              </div>

              <div className="checkout-divider" />

              <div className="checkout-summary-row">
                <span>Subtotal</span>
                <span className="checkout-summary-row-value">{formatPrice(subtotal)}</span>
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
                type="button"
                onClick={handleSubmit}
                className="checkout-place-order-btn checkout-place-order-btn-desktop"
                disabled={submitting}
              >
                {submitting ? <span className="spinner small"></span> : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;