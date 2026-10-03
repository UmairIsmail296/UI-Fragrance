import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useCart } from '../context/CartContext.jsx';
import { formatPrice } from '../utils/price.js';
import api from '../utils/api.js';
import './PaymentConfirmationPage.css';

const MAX_SCREENSHOT_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
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

  useEffect(() => {
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

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
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
      clearCart();
      navigate('/order-success', { state: { trackingId: data.order.orderId } });
    } catch (error) {
      const message = error.response?.data?.message || 'Something went wrong. Please try again.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (cartItems.length === 0 || !state?.customer) return null;

  const total = getTotalPrice();

  return (
    <main className="payment-confirmation-page">
      <div className="container payment-confirmation-container">
        <nav className="payment-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span>&gt;</span>
          <Link to="/cart">Cart</Link>
          <span>&gt;</span>
          <Link to="/checkout">Checkout</Link>
          <span>&gt;</span>
          <span aria-current="page">Payment</span>
        </nav>

        <section className="payment-confirmation-card">
          <h1>Payment Confirmation</h1>
          <p className="payment-instruction">Please make the payment first to confirm this order.</p>

          <div className="payment-bank-details">
            <h2>Bank Transfer Details</h2>
            <dl>
              <div>
                <dt>Bank Name</dt>
                <dd>{BANK_DETAILS.bankName}</dd>
              </div>
              <div>
                <dt>Account Name</dt>
                <dd>{BANK_DETAILS.accountName}</dd>
              </div>
              <div>
                <dt>Account Number</dt>
                <dd>{BANK_DETAILS.accountNumber}</dd>
              </div>
              <div className="payment-total-row">
                <dt>Order Total</dt>
                <dd>{formatPrice(total)}</dd>
              </div>
            </dl>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="payment-upload-field">
              <label htmlFor="paymentScreenshot">Upload payment screenshot *</label>
              <input
                id="paymentScreenshot"
                name="paymentScreenshot"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleScreenshotChange}
                required
              />
              <small>JPG, PNG, WEBP, or GIF. Maximum file size: 5 MB.</small>
            </div>

            {previewUrl && (
              <div className="payment-screenshot-preview">
                <img src={previewUrl} alt="Preview of uploaded payment screenshot" />
                <span>{screenshot.name}</span>
              </div>
            )}

            <p className="payment-order-total">
              Items: {cartItems.reduce((sum, item) => sum + item.quantity, 0)} · Total: {formatPrice(total)}
            </p>

            <button
              type="submit"
              className="payment-place-order-btn"
              disabled={submitting || !screenshot}
            >
              {submitting ? <span className="spinner small" /> : 'Place Order'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
};

export default PaymentConfirmationPage;
