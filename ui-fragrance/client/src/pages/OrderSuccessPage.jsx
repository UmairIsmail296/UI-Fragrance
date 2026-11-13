import React, { useEffect, useRef, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import './OrderSuccessPage.css';

const OrderSuccessPage = () => {
  const { state } = useLocation();
  const trackingId = state?.trackingId;
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef(null);

  useEffect(() => {
    return () => clearTimeout(copyTimer.current);
  }, []);

  const handleCopy = async () => {
    if (!trackingId) return;

    try {
      await navigator.clipboard.writeText(trackingId);
      setCopied(true);
      toast.success('Tracking ID copied to clipboard!');

      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2500);
    } catch (error) {
      toast.error('Unable to copy. Please select and copy your tracking ID.');
    }
  };

  const whatsappMessage = trackingId
    ? `Hi UI Fragrance, I just placed an order with ID: ${trackingId}`
    : 'Hi UI Fragrance, I need help with my order.';

  return (
    <main className="order-success-page">
      <div className="container">
        {trackingId ? (
          <div className="lux-success-card">
            <div className="success-icon-inner" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline
                  points="20 6 9 17 4 12"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <span className="success-badge">Order placed</span>
            <h1 className="success-title">
              Thank You for Your <span>Order</span>
            </h1>
            <p className="success-subtitle">
              Your order has been placed successfully. Our team will review
              your payment screenshot and contact you with any updates.
            </p>

            <div className="tracking-voucher-box">
              <div className="voucher-info">
                <span className="voucher-label">Your tracking ID</span>
                <span className="voucher-code">{trackingId}</span>
              </div>

              <button
                type="button"
                className={`copy-code-btn ${copied ? 'copied' : ''}`}
                onClick={handleCopy}
              >
                {copied ? '✓ Copied' : 'Copy ID'}
              </button>
            </div>

            <p className="success-note">
              Save your tracking ID to check your order status.
            </p>

            <div className="success-actions">
              <Link to="/track-order" className="btn-track-lux">
                Track your order <span aria-hidden="true">→</span>
              </Link>
              <Link to="/shop" className="btn-shop-lux">
                Continue shopping
              </Link>
            </div>

            <div className="success-help">
              <span>Need help with your order?</span>
              <a
                href={`https://wa.me/923096248054?text=${encodeURIComponent(
                  whatsappMessage
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="whatsapp-concierge"
              >
                Chat with us on WhatsApp <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="lux-success-card">
            <h1 className="success-title">Order details unavailable</h1>
            <p className="success-subtitle">
              We can’t display a tracking ID on this page. If you placed an
              order, check your order details or contact us for help.
            </p>

            <div className="success-actions">
              <Link to="/track-order" className="btn-track-lux">
                Track an order <span aria-hidden="true">→</span>
              </Link>
              <Link to="/shop" className="btn-shop-lux">
                Continue shopping
              </Link>
            </div>

            <div className="success-help">
              <span>Need help finding your order?</span>
              <a
                href={`https://wa.me/923096248054?text=${encodeURIComponent(
                  whatsappMessage
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="whatsapp-concierge"
              >
                Chat with us on WhatsApp <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default OrderSuccessPage;