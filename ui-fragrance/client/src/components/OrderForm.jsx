import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../utils/api.js';
import { useOrderForm } from '../context/OrderFormContext.jsx';
import './OrderForm.css';

const initialForm = {
  fullName: '',
  email: '',
  mobile: '',
  city: '',
  area: '',
  selectedPerfume: '',
  quantity: 1,
};

// Used only for the preview. The server determines the final price.
const parsePkrAmount = (value) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value >= 0 ? value : null;
  }

  if (typeof value !== 'string') return null;

  const match = value.match(/(\d[\d,]*)(\.\d{1,2})?\s*$/);
  if (!match) return null;

  const amount = Number(match[1].replace(/,/g, '') + (match[2] || ''));
  return Number.isFinite(amount) ? amount : null;
};

const OrderForm = () => {
  const { isOpen, presetPerfume, closeOrderForm } = useOrderForm();

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [perfumes, setPerfumes] = useState([]);
  const [loadingPerfumes, setLoadingPerfumes] = useState(false);
  const [perfumeLoadError, setPerfumeLoadError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState(null);

  const closeButtonRef = useRef(null);
  const drawerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement;

    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    let active = true;

    setForm((prev) => ({
      ...prev,
      selectedPerfume: presetPerfume || prev.selectedPerfume,
    }));
    setSuccessOrderId(null);
    setPerfumeLoadError(false);
    setLoadingPerfumes(true);

    const fetchPerfumes = async () => {
      try {
        const { data } = await api.get('/perfumes');

        if (active) {
          setPerfumes(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Failed to load perfumes for order form', error);

        if (active) {
          setPerfumes([]);
          setPerfumeLoadError(true);
        }
      } finally {
        if (active) setLoadingPerfumes(false);
      }
    };

    fetchPerfumes();

    return () => {
      active = false;
    };
  }, [isOpen, presetPerfume]);

  const selectedPerfumeObj = perfumes.find(
    (perfume) => perfume.name === form.selectedPerfume
  );

  // Uses the same `price` field as the original form. If it is missing,
  // show no preview rather than a potentially misleading Rs. 0.
  const unitPrice = selectedPerfumeObj
    ? parsePkrAmount(selectedPerfumeObj.price)
    : null;

  const numericQuantity = Number(form.quantity);
  const totalPrice =
    unitPrice !== null && form.quantity !== ''
      ? unitPrice * numericQuantity
      : null;

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === 'mobile' && value !== '' && !/^[0-9]*$/.test(value)) {
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const changeQuantity = (amount) => {
    setForm((prev) => {
      const current = prev.quantity === '' ? 1 : Number(prev.quantity);

      return {
        ...prev,
        quantity: Math.max(1, Math.min(10, current + amount)),
      };
    });

    setErrors((prev) => ({ ...prev, quantity: '' }));
  };

  const handleQuantityInputChange = (event) => {
    const raw = event.target.value;

    if (raw === '') {
      setForm((prev) => ({ ...prev, quantity: '' }));
      return;
    }

    const parsed = Number(raw);
    if (!Number.isInteger(parsed)) return;

    setForm((prev) => ({
      ...prev,
      quantity: Math.max(1, Math.min(10, parsed)),
    }));

    setErrors((prev) => ({ ...prev, quantity: '' }));
  };

  const handleQuantityBlur = () => {
    if (form.quantity === '') {
      setForm((prev) => ({ ...prev, quantity: 1 }));
      setErrors((prev) => ({ ...prev, quantity: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!form.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      newErrors.email = 'Enter a valid email address';
    }

    if (!form.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    }

    if (!form.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!form.area.trim()) {
      newErrors.area = 'Area / street address is required';
    }

    if (!form.selectedPerfume) {
      newErrors.selectedPerfume = 'Please select a perfume';
    }

    const quantity = Number(form.quantity);

    if (
      form.quantity === '' ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 10
    ) {
      newErrors.quantity = 'Quantity must be between 1 and 10';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting || !validate()) return;

    setSubmitting(true);

    try {
      const { data } = await api.post('/orders', {
        customerName: form.fullName.trim(),
        customerEmail: form.email.trim(),
        customerMobile: form.mobile.trim(),
        customerCity: form.city.trim(),
        customerArea: form.area.trim(),
        selectedPerfume: form.selectedPerfume,
        quantity: Number(form.quantity),
      });

      setSuccessOrderId(data.order.orderId);
      toast.success('Order placed successfully!');
      setForm(initialForm);
      setErrors({});
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'Something went wrong. Please try again.';

      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    // Keep the drawer open until the order request finishes.
    if (submitting) return;

    setForm(initialForm);
    setErrors({});
    setSuccessOrderId(null);
    closeOrderForm();
  };

  const handleDrawerKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      handleClose();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusable = drawerRef.current?.querySelectorAll(
      'button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])'
    );

    if (!focusable?.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="order-drawer-overlay"
      onClick={handleClose}
    >
      <div
        ref={drawerRef}
        className="order-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-drawer-title"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={handleDrawerKeyDown}
      >
        <button
          ref={closeButtonRef}
          type="button"
          className="order-drawer-close"
          onClick={handleClose}
          disabled={submitting}
          aria-label="Close order form"
        >
          &times;
        </button>

        {successOrderId ? (
          <div className="order-success" role="status">
            <div className="order-success-icon" aria-hidden="true">
              ✓
            </div>

            <h3 id="order-drawer-title">Order placed!</h3>

            <p>
              Your tracking ID is <strong>{successOrderId}</strong>.
              Use this ID on our Track Order page.
            </p>

            <button
              type="button"
              className="order-button"
              onClick={handleClose}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="order-drawer-heading">
              <p className="order-drawer-eyebrow">UI Fragrance</p>

              <h3 className="order-drawer-title" id="order-drawer-title">
                Place your <span>order.</span>
              </h3>

              <p className="order-drawer-subtitle">
                Fill in your details and we&apos;ll get your fragrance ready
                for delivery.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="order-form-group">
                <label htmlFor="order-fullName">Full name *</label>
                <input
                  id="order-fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Your full name"
                  aria-invalid={Boolean(errors.fullName)}
                  aria-describedby={errors.fullName ? 'order-fullName-error' : undefined}
                />
                {errors.fullName && (
                  <span className="order-error" id="order-fullName-error">
                    {errors.fullName}
                  </span>
                )}
              </div>

              <div className="order-form-group">
                <label htmlFor="order-email">Email address *</label>
                <input
                  id="order-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'order-email-error' : undefined}
                />
                {errors.email && (
                  <span className="order-error" id="order-email-error">
                    {errors.email}
                  </span>
                )}
              </div>

              <div className="order-form-group">
                <label htmlFor="order-mobile">Mobile number *</label>
                <input
                  id="order-mobile"
                  name="mobile"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={form.mobile}
                  onChange={handleChange}
                  placeholder="03XXXXXXXXX"
                  aria-invalid={Boolean(errors.mobile)}
                  aria-describedby={errors.mobile ? 'order-mobile-error' : undefined}
                />
                {errors.mobile && (
                  <span className="order-error" id="order-mobile-error">
                    {errors.mobile}
                  </span>
                )}
              </div>

              <div className="order-form-group">
                <label htmlFor="order-city">City *</label>
                <input
                  id="order-city"
                  name="city"
                  type="text"
                  autoComplete="address-level2"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Your city"
                  aria-invalid={Boolean(errors.city)}
                  aria-describedby={errors.city ? 'order-city-error' : undefined}
                />
                {errors.city && (
                  <span className="order-error" id="order-city-error">
                    {errors.city}
                  </span>
                )}
              </div>

              <div className="order-form-group">
                <label htmlFor="order-area">Area / street address *</label>
                <input
                  id="order-area"
                  name="area"
                  type="text"
                  autoComplete="street-address"
                  value={form.area}
                  onChange={handleChange}
                  placeholder="House #, street, area"
                  aria-invalid={Boolean(errors.area)}
                  aria-describedby={errors.area ? 'order-area-error' : undefined}
                />
                {errors.area && (
                  <span className="order-error" id="order-area-error">
                    {errors.area}
                  </span>
                )}
              </div>

              <div className="order-form-group">
                <label htmlFor="order-perfume">Select perfume *</label>
                <select
                  id="order-perfume"
                  name="selectedPerfume"
                  value={form.selectedPerfume}
                  onChange={handleChange}
                  disabled={loadingPerfumes || perfumeLoadError}
                  aria-invalid={Boolean(errors.selectedPerfume)}
                  aria-describedby={
                    errors.selectedPerfume
                      ? 'order-perfume-error'
                      : undefined
                  }
                >
                  <option value="">
                    {loadingPerfumes ? 'Loading perfumes...' : 'Choose a perfume'}
                  </option>

                  {perfumes.map((perfume) => (
                    <option key={perfume._id} value={perfume.name}>
                      {perfume.name}
                      {perfume.price != null ? ` — ${perfume.price}` : ''}
                    </option>
                  ))}
                </select>

                {perfumeLoadError && (
                  <span className="order-error" role="alert">
                    Could not load perfumes. Close and reopen the form to try
                    again.
                  </span>
                )}

                {errors.selectedPerfume && (
                  <span className="order-error" id="order-perfume-error">
                    {errors.selectedPerfume}
                  </span>
                )}
              </div>

              <div className="order-form-group">
                <label htmlFor="order-quantity">Quantity *</label>

                <div className="order-quantity">
                  <button
                    type="button"
                    onClick={() => changeQuantity(-1)}
                    disabled={form.quantity !== '' && form.quantity <= 1}
                    aria-label="Decrease quantity"
                  >
                    &minus;
                  </button>

                  <input
                    id="order-quantity"
                    name="quantity"
                    type="number"
                    min="1"
                    max="10"
                    value={form.quantity}
                    onChange={handleQuantityInputChange}
                    onBlur={handleQuantityBlur}
                    aria-invalid={Boolean(errors.quantity)}
                    aria-describedby={
                      errors.quantity ? 'order-quantity-error' : undefined
                    }
                  />

                  <button
                    type="button"
                    onClick={() => changeQuantity(1)}
                    disabled={form.quantity !== '' && form.quantity >= 10}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                {errors.quantity && (
                  <span className="order-error" id="order-quantity-error">
                    {errors.quantity}
                  </span>
                )}
              </div>

              {selectedPerfumeObj && unitPrice !== null && (
                <div className="order-price-preview">
                  <div>
                    <span>Unit price</span>
                    <strong>Rs. {unitPrice.toLocaleString('en-PK')}</strong>
                  </div>

                  <div>
                    <span>Quantity</span>
                    <strong>{form.quantity || '—'}</strong>
                  </div>

                  <div className="order-price-total">
                    <span>Estimated total</span>
                    <strong>
                      {totalPrice === null
                        ? '—'
                        : `Rs. ${totalPrice.toLocaleString('en-PK')}`}
                    </strong>
                  </div>
                </div>
              )}

              {selectedPerfumeObj && unitPrice === null && (
                <p className="order-price-note">
                  Price preview unavailable. The server will calculate the
                  order total.
                </p>
              )}

              <button
                type="submit"
                className="order-button order-submit"
                disabled={submitting || loadingPerfumes || perfumeLoadError}
              >
                {submitting ? (
                  <>
                    <span className="order-spinner" aria-hidden="true" />
                    Placing order...
                  </>
                ) : (
                  'Place order'
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default OrderForm;