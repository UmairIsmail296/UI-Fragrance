import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import './OrderSuccessPage.css';

const OrderSuccessPage = () => {
  const { state } = useLocation();
  const trackingId = state?.trackingId || null;

  return (
    <div className="page-fade order-success-page">
      <div className="container text-center" style={{ padding: '120px 0' }}>
        <div className="success-icon">✓</div>
        <h2>Your order has been placed successfully!</h2>
        {trackingId && (
          <p className="tracking-id">Tracking ID: <strong>{trackingId}</strong></p>
        )}
        <p>A confirmation email has been sent to your email address.</p>
        <div style={{ marginTop: 20 }}>
          <Link to="/track-order" className="btn-outline" style={{ marginRight: 10 }}>Track Your Order</Link>
          <Link to="/shop" className="btn-gold">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
