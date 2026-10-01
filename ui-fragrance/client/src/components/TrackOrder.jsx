import React, { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../utils/api.js';
import OrderStepper from './OrderStepper.jsx';
import './TrackOrder.css';

const TRACKING_ID_PATTERN = /^UIF-[A-Z0-9]{6}$/i;

const TrackOrder = () => {
  const [orderIdInput, setOrderIdInput] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleTrack = async (e) => {
    e.preventDefault();
    const trimmed = orderIdInput.trim().toUpperCase();

    if (!trimmed) {
      toast.error('Please enter your Tracking ID');
      return;
    }

    if (!TRACKING_ID_PATTERN.test(trimmed)) {
      toast.error('Tracking ID must follow format: UIF-XXXXXX');
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const { data } = await api.get(`/orders/track/${trimmed}`);
      setOrder(data);
    } catch (error) {
      setOrder(null);
      const message = error.response?.data?.message || 'Order not found';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusClass = (status = '') => {
    const s = status.toLowerCase();
    if (s.includes('deliver')) return 'status-delivered';
    if (s.includes('ship') || s.includes('transit') || s.includes('dispatch')) return 'status-shipped';
    if (s.includes('cancel')) return 'status-cancelled';
    return 'status-processing';
  };

  const orderItems = Array.isArray(order?.items) ? order.items : [];
  const totalQuantity = orderItems.reduce((total, item) => {
    const quantity = Number(item.quantity);
    return total + (Number.isFinite(quantity) ? quantity : 0);
  }, 0);

  return (
    <div className="track-order-container">
      {/* Header Info */}
      <div className="track-header-box text-center">
        <span className="track-tag">Live Order Tracking</span>
        <h2 className="track-main-title">Track Your <span>Fragrance</span></h2>
        <p className="track-desc">
          Enter your unique Tracking ID sent via confirmation SMS/Email.
        </p>
      </div>

      {/* Search Bar Form */}
      <form className="track-search-form" onSubmit={handleTrack}>
        <div className="search-input-wrapper">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8" strokeWidth="1.8" />
            <path d="m21 21-4.35-4.35" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="e.g. UIF-4A7K92"
            value={orderIdInput}
            onChange={(e) => setOrderIdInput(e.target.value.toUpperCase())}
            maxLength={10}
            spellCheck="false"
          />
        </div>
        <button type="submit" className="track-submit-btn" disabled={loading}>
          {loading ? (
            <span className="track-btn-loader"></span>
          ) : (
            <>
              <span>Track Now</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="arrow-icon">
                <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </>
          )}
        </button>
      </form>

      {/* Loading Skeleton / Animation */}
      {loading && (
        <div className="track-loading-state">
          <div className="gold-pulse-loader"></div>
          <p>Locating your luxury package...</p>
        </div>
      )}

      {/* Order Details Found Card */}
      {!loading && order && (
        <div className="track-result-card">
          {/* Card Top Header */}
          <div className="card-top-bar">
            <div className="order-id-pill">
              <span className="id-label">Tracking:</span>
              <span className="id-code">{order.orderId}</span>
              <button 
                type="button" 
                className="copy-btn" 
                onClick={() => handleCopyId(order.orderId)}
                title="Copy ID"
              >
                {copied ? '✓' : '⧉'}
              </button>
            </div>
            <div className={`status-pill ${getStatusClass(order.orderStatus)}`}>
              <span className="status-dot"></span>
              {order.orderStatus}
            </div>
          </div>

          {/* Core Info Grid */}
          <div className="order-meta-grid">
            <div className="meta-box perfume-highlight">
              <span className="meta-label">Selected Fragrance</span>
              <h3 className="perfume-name">
                {orderItems.length
                  ? orderItems.map((item) => `${item.perfumeName} (Qty ${item.quantity}, Rs. ${Number(item.unitPrice).toLocaleString('en-PK')} each)`).join('; ')
                  : order.selectedPerfume || '—'}
              </h3>
            </div>

            <div className="meta-box">
              <span className="meta-label">Recipient</span>
              <p className="meta-value customer-name">{order.customerName}</p>
            </div>
          </div>

          {/* Pricing & Quantity Strip */}
          <div className="financial-strip">
            <div className="strip-item">
              <span className="strip-label">Quantity</span>
              <span className="strip-val">{totalQuantity} {totalQuantity === 1 ? 'Bottle' : 'Bottles'}</span>
            </div>
            <div className="strip-divider"></div>
            <div className="strip-item">
              <span className="strip-label">Unit Price</span>
              <span className="strip-val">
                {orderItems.length === 1
                  ? `Rs. ${Number(orderItems[0].unitPrice).toLocaleString('en-PK')}`
                  : `${orderItems.length} item prices above`}
              </span>
            </div>
            <div className="strip-divider"></div>
            <div className="strip-item highlight-total">
              <span className="strip-label">Total Amount</span>
              <span className="strip-val total-price">Rs. {Number(order.totalAmount).toLocaleString('en-PK')}</span>
            </div>
          </div>

          {/* Stepper Progress Section */}
          <div className="stepper-wrapper-lux">
            <h4 className="stepper-title">Delivery Progress</h4>
            <OrderStepper currentStatus={order.orderStatus} />
          </div>
        </div>
      )}

      {/* Not Found / Empty State */}
      {!loading && !order && searched && (
        <div className="track-empty-state">
          <div className="empty-icon">⚲</div>
          <h4>No Shipment Found</h4>
          <p>We couldn't locate an order matching <strong>"{orderIdInput}"</strong>. Please verify the tracking code and try again.</p>
        </div>
      )}
    </div>
  );
};

export default TrackOrder;