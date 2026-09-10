import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../utils/api.js';
import { useOrderForm } from '../context/OrderFormContext.jsx';
import './OrderForm.css';
// REMOVED: import PaymentSelector from './PaymentSelector.jsx' — payment
// integration has been fully removed from the order form.

const initialForm = {
  fullName: '',
  email: '',
  mobile: '',
  city: '',
  area: '',
  selectedPerfume: '',
  quantity: 1, // NEW
};

const OrderForm = () => {
  const { isOpen, presetPerfume, closeOrderForm } = useOrderForm();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [perfumes, setPerfumes] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      fetchPerfumes();
      setForm((prev) => ({ ...prev, selectedPerfume: presetPerfume || prev.selectedPerfume }));
      setSuccessOrderId(null);
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, presetPerfume]);

  const fetchPerfumes = async () => {
    try {
      const { data } = await api.get('/perfumes');
      setPerfumes(data);
    } catch (error) {
      console.error('Failed to load perfumes for order form', error);
    }
  };

  // NEW: the selected perfume's full record, used to display unit/total price
  const selectedPerfumeObj = perfumes.find((p) => p.name === form.selectedPerfume);

  // NEW: parses a display price like "Rs. 4,500" into a number (mirrors the
  // server-side parser in server/utils/parsePrice.js — used here only for
  // showing a live preview; the server always recalculates authoritatively)
  const parsePkrAmount = (priceString) => {
    if (typeof priceString !== 'string') return 0;
    const match = priceString.match(/(\d[\d,]*)(\.\d{1,2})?\s*$/);
    if (!match) return 0;
    return parseFloat(match[1].replace(/,/g, '') + (match[2] || ''));
  };

  const unitPrice = selectedPerfumeObj ? parsePkrAmount(selectedPerfumeObj.price) : 0;
  const totalPrice = unitPrice * form.quantity;

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'mobile' && value !== '' && !/^[0-9]*$/.test(value)) {
      return; // block non-numeric input
    }

    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // NEW: quantity stepper handlers (min 1, max 10)
  const decrementQuantity = () => {
    setForm((prev) => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }));
  };

  const incrementQuantity = () => {
    setForm((prev) => ({ ...prev, quantity: Math.min(10, prev.quantity + 1) }));
  };

  const handleQuantityInputChange = (e) => {
    const raw = e.target.value;
    if (raw === '') {
      setForm((prev) => ({ ...prev, quantity: '' }));
      return;
    }
    const parsed = parseInt(raw, 10);
    if (Number.isNaN(parsed)) return;
    setForm((prev) => ({ ...prev, quantity: Math.min(10, Math.max(1, parsed)) }));
  };

  const handleQuantityBlur = () => {
    if (form.quantity === '' || Number.isNaN(Number(form.quantity))) {
      setForm((prev) => ({ ...prev, quantity: 1 }));
    }
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
    if (!form.selectedPerfume) newErrors.selectedPerfume = 'Please select a perfume';

    // NEW: quantity validation
    const qty = Number(form.quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > 10) {
      newErrors.quantity = 'Quantity must be between 1 and 10';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      // NEW: quantity sent to the server; the server derives unitPrice
      // itself and computes totalAmount — see orderRoutes.js
      const { data } = await api.post('/orders', {
        customerName: form.fullName,
        customerEmail: form.email,
        customerMobile: form.mobile,
        customerCity: form.city,
        customerArea: form.area,
        selectedPerfume: form.selectedPerfume,
        quantity: form.quantity,
      });

      setSuccessOrderId(data.order.orderId);
      toast.success('Order placed successfully!');
      setForm(initialForm);
    } catch (error) {
      const message = error.response?.data?.message || 'Something went wrong. Please try again.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setForm(initialForm);
    setErrors({});
    setSuccessOrderId(null);
    closeOrderForm();
  };

  if (!isOpen) return null;

  return (
    <div className="order-drawer-overlay" onClick={handleClose}>
      <div className="order-drawer" onClick={(e) => e.stopPropagation()}>
        <button className="order-drawer-close" onClick={handleClose} aria-label="Close">
          &times;
        </button>

        {successOrderId ? (
          <div className="order-success">
            <div className="order-success-icon">✓</div>
            <h3>Order Placed!</h3>
            <p>
              Your Tracking ID is: <strong>{successOrderId}</strong>. A confirmation
              email is on its way. Use this ID anytime on our Track Order page.
            </p>
            <button className="btn-gold" onClick={handleClose}>
              Done
            </button>
          </div>
        ) : (
          <>
            <h3 className="order-drawer-title">
              Place Your <span>Order</span>
            </h3>
            <p className="order-drawer-subtitle">
              Fill in your details and we'll get your fragrance ready for delivery.
            </p>

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="fullName">Full Name *</label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Your full name"
                />
                {errors.fullName && <span className="error-text">{errors.fullName}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                />
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="mobile">Mobile Number *</label>
                <input
                  id="mobile"
                  name="mobile"
                  type="tel"
                  inputMode="numeric"
                  value={form.mobile}
                  onChange={handleChange}
                  placeholder="03XXXXXXXXX"
                />
                {errors.mobile && <span className="error-text">{errors.mobile}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="city">City *</label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Your city"
                />
                {errors.city && <span className="error-text">{errors.city}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="area">Area / Street Address *</label>
                <input
                  id="area"
                  name="area"
                  type="text"
                  value={form.area}
                  onChange={handleChange}
                  placeholder="House #, Street, Area"
                />
                {errors.area && <span className="error-text">{errors.area}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="selectedPerfume">Select Perfume *</label>
                <select
                  id="selectedPerfume"
                  name="selectedPerfume"
                  value={form.selectedPerfume}
                  onChange={handleChange}
                >
                  <option value="">-- Choose a perfume --</option>
                  {perfumes.map((p) => (
                    <option key={p._id} value={p.name}>
                      {p.name} — {p.price}
                    </option>
                  ))}
                </select>
                {errors.selectedPerfume && (
                  <span className="error-text">{errors.selectedPerfume}</span>
                )}
              </div>

              {/* NEW: quantity stepper */}
              <div className="form-group">
                <label htmlFor="quantity">Quantity *</label>
                <div className="quantity-stepper">
                  <button
                    type="button"
                    className="quantity-btn"
                    onClick={decrementQuantity}
                    disabled={form.quantity <= 1}
                    aria-label="Decrease quantity"
                  >
                    &minus;
                  </button>
                  <input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min={1}
                    max={10}
                    value={form.quantity}
                    onChange={handleQuantityInputChange}
                    onBlur={handleQuantityBlur}
                  />
                  <button
                    type="button"
                    className="quantity-btn"
                    onClick={incrementQuantity}
                    disabled={form.quantity >= 10}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
                {errors.quantity && <span className="error-text">{errors.quantity}</span>}
              </div>

              {/* NEW: live unit/total price preview */}
              {selectedPerfumeObj && (
                <div className="price-preview">
                  Unit Price: <strong>Rs. {unitPrice.toLocaleString('en-PK')}</strong>
                  {' × Quantity: '}
                  <strong>{form.quantity || 0}</strong>
                  {' = Total: '}
                  <strong className="price-preview-total">
                    Rs. {totalPrice.toLocaleString('en-PK')}
                  </strong>
                </div>
              )}

              <button type="submit" className="btn-gold order-submit-btn" disabled={submitting}>
                {submitting ? <span className="spinner small"></span> : 'Place Order'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default OrderForm;