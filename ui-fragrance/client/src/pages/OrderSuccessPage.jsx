import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

import './OrderSuccessPage.css';

const OrderSuccessPage = () => {
  const { state } = useLocation();
  const trackingId = state?.trackingId || 'UIF-SAMPLE';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!trackingId) return;
    navigator.clipboard.writeText(trackingId);
    setCopied(true);
    toast.success('Tracking ID copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="order-success-page">
      {/* Ambient Luxury Background Glow */}
      <div className="success-ambient-glow"></div>

      <div className="container">
        <div className="lux-success-card">
          
          {/* Animated Gold Success Icon */}
          <div className="success-icon-wrapper">
            <div className="icon-pulse-ring"></div>
            <div className="success-icon-inner">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="20 6 9 17 4 12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          <span className="success-badge">Order Confirmed</span>
          <h1 className="success-title">
            Thank You For Your <span>Distinction</span>
          </h1>
          <p className="success-subtitle">
            Our Team Contact within 24 hour for payment.Your artisanal fragrance is now being prepared with utmost precision and care.
          </p>

          {/* Tracking ID Voucher Box */}
          <div className="tracking-voucher-box">
            <div className="voucher-info">
              <span className="voucher-label">Your Unique Tracking Code</span>
              <span className="voucher-code">{trackingId}</span>
            </div>
            <button 
              type="button" 
              className={`copy-code-btn ${copied ? 'copied' : ''}`}
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <span>✓</span> Copied
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Copy ID
                </>
              )}
            </button>
          </div>

          {/* Next Steps Progress Ribbon */}
          <div className="order-next-steps">
            <div className="step-box">
              <div className="step-num">01</div>
              <div className="step-details">
                <h5>Order Verified</h5>
                <p>Details received</p>
              </div>
            </div>
            <div className="step-connector"></div>
            <div className="step-box">
              <div className="step-num">02</div>
              <div className="step-details">
                <h5>Handcrafted Blend</h5>
                <p>Carefully packed</p>
              </div>
            </div>
            <div className="step-connector"></div>
            <div className="step-box">
              <div className="step-num">03</div>
              <div className="step-details">
                <h5>Express Dispatch</h5>
                <p>Delivered to your door</p>
              </div>
            </div>
          </div>

          {/* Email / SMS Notice */}
          <p className="success-note">
            A confirmation receipt and tracking updates have been sent to your contact details.
          </p>

          {/* Call to Actions */}
          <div className="success-actions">
            <Link to="/track-order" className="btn-track-lux">
              Track Order Status
            </Link>
            <Link to="/shop" className="btn-shop-lux">
              Explore Collection
            </Link>
          </div>

          {/* WhatsApp Direct Concierge Help */}
          <div className="success-help">
            <span>Need any changes to your address?</span>
            <a 
              href={`https://wa.me/923096248054?text=Hi%20UI%20Fragrance,%20I%20just%20placed%20an%20order%20with%20ID:%20${trackingId}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="whatsapp-concierge"
            >
              Chat with Concierge on WhatsApp →
            </a>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;