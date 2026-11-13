import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useCart } from '../context/CartContext.jsx';
import { formatPrice } from '../utils/price.js';
import api from '../utils/api.js';
import './PaymentConfirmationPage.css';

const MAX_SCREENSHOT_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

const BANK_DETAILS = {
  bankName: 'Meezan Bank',
  accountName: 'MUHAMMAD IBSHAM FAYYAZ',
  accountNumber: '98270112334414',
};

const PaymentConfirmationPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { cartItems, getTotalPrice, clearCart } = useCart();

  const [screenshot, setScreenshot] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const orderPlaced = useRef(false);

  useEffect(() => {
    if (orderPlaced.current) return;

    if (cartItems.length === 0) {
      toast.error('Your cart is empty. Add items before checkout.');
      navigate('/cart', { replace: true });
    } else if (!state?.customer) {
      toast.error('Please enter your shipping details first.');
      navigate('/checkout', { replace: true });
    }
  }, [cartItems.length, navigate, state]);

  const previewUrl = useMemo(
    () => (screenshot ? URL.createObjectURL(screenshot) : null),
    [screenshot]
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleScreenshotChange = (event) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setScreenshot(null);
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      event.target.value = '';
      setScreenshot(null);
      toast.error('Please upload a JPG, PNG, WEBP, or GIF image.');
      return;
    }

    if (file.size > MAX_SCREENSHOT_SIZE) {
      event.target.value = '';
      setScreenshot(null);
      toast.error('The payment screenshot must be 5 MB or smaller.');
      return;
    }

    setScreenshot(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) return;

    if (!state?.customer) {
      toast.error('Please enter your shipping details first.');
      navigate('/checkout', { replace: true });
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Your cart is empty.');
      navigate('/cart', { replace: true });
      return;
    }

    if (!screenshot) {
      toast.error('Upload your payment screenshot before placing the order.');
      return;
    }

    const formData = new FormData();

    formData.append('paymentScreenshot', screenshot);
    formData.append('customerName', state.customer.fullName);
    formData.append('customerEmail', state.customer.email);
    formData.append('customerMobile', state.customer.mobile);
    formData.append('customerCity', state.customer.city);
    formData.append('customerArea', state.customer.area);
    formData.append(
      'items',
      JSON.stringify(
        cartItems.map((item) => ({
          perfumeId: item.perfumeId,
          quantity: item.quantity,
        }))
      )
    );

    setSubmitting(true);

    try {
      const { data } = await api.post('/orders', formData);

      // Prevent the empty-cart redirect while navigating after a successful order.
      orderPlaced.current = true;
      clearCart();

      navigate('/order-success', {
        state: { trackingId: data.order.orderId },
      });
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'Something went wrong. Please try again.';

      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (cartItems.length === 0 || !state?.customer) return null;

  const total = getTotalPrice();
  const totalItems = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return (
    <main className="payment-confirmation-page">
      <div className="container payment-confirmation-container">
        <nav className="payment-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden="true">/</span>
          <Link to="/cart">Cart</Link>
          <span aria-hidden="true">/</span>
          <Link to="/checkout">Checkout</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Payment</span>
        </nav>

        <section
          className="payment-confirmation-card"
          aria-labelledby="payment-heading"
        >
          <div className="payment-header">
            <span className="payment-eyebrow">Complete your order</span>
            <h1 id="payment-heading">Payment Confirmation</h1>
            <p className="payment-instruction">
              Make a bank transfer, then upload your payment screenshot to
              place your order.
            </p>
          </div>

          <div className="payment-bank-details">
            <h2>Bank Transfer Details</h2>

            <dl>
              <div>
                <dt>Bank name</dt>
                <dd>{BANK_DETAILS.bankName}</dd>
              </div>

              <div>
                <dt>Account name</dt>
                <dd>{BANK_DETAILS.accountName}</dd>
              </div>

              <div>
                <dt>Account number</dt>
                <dd>{BANK_DETAILS.accountNumber}</dd>
              </div>

              <div className="payment-total-row">
                <dt>Order total</dt>
                <dd>{formatPrice(total)}</dd>
              </div>
            </dl>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="payment-upload-field">
              <label htmlFor="paymentScreenshot">
                Payment screenshot <span aria-hidden="true">*</span>
              </label>

              <input
                id="paymentScreenshot"
                name="paymentScreenshot"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleScreenshotChange}
                aria-describedby="payment-upload-hint"
                required
              />

              <small id="payment-upload-hint">
                JPG, PNG, WEBP, or GIF. Maximum file size: 5 MB.
              </small>
            </div>

            {previewUrl && (
              <div className="payment-screenshot-preview">
                <img
                  src={previewUrl}
                  alt="Preview of uploaded payment screenshot"
                />
                <span>{screenshot.name}</span>
              </div>
            )}

            <div className="payment-order-total">
              <span>
                {totalItems} {totalItems === 1 ? 'item' : 'items'}
              </span>
              <strong>{formatPrice(total)}</strong>
            </div>

            <button
              type="submit"
              className="payment-place-order-btn"
              disabled={submitting || !screenshot}
            >
              {submitting ? 'Placing order...' : 'Place order'}
            </button>

            <p className="payment-review-note">
              Your payment screenshot will be reviewed after you place your
              order.
            </p>
          </form>

          <Link to="/checkout" className="payment-back-link">
            <span aria-hidden="true">←</span> Return to checkout
          </Link>
        </section>
      </div>
    </main>
  );
};

export default PaymentConfirmationPage;