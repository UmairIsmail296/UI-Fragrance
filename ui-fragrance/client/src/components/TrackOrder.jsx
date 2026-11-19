import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../utils/api.js';
import OrderStepper from './OrderStepper.jsx';
import './TrackOrder.css';

const TRACKING_ID_PATTERN = /^UIF-[A-Z0-9]{6}$/i;

const fetchTrackedOrder = async (trackingId) => {
  const { data } = await api.get(
    `/orders/track/${encodeURIComponent(trackingId)}`
  );
  return data;
};

const formatAmount = (value) => {
  if (value === null || value === undefined || value === '') return '—';

  const amount = Number(value);
  return Number.isFinite(amount)
    ? `Rs. ${amount.toLocaleString('en-PK')}`
    : '—';
};

const formatDate = (value) => (value ? new Date(value).toLocaleDateString(undefined, {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}) : '—');

const getStatusClass = (status = '') => {
  const value = String(status).toLowerCase();

  if (value.includes('deliver')) return 'status-delivered';
  if (
    value.includes('ship') ||
    value.includes('transit') ||
    value.includes('dispatch')
  ) {
    return 'status-shipped';
  }
  if (value.includes('cancel')) return 'status-cancelled';
  return 'status-processing';
};

const TrackOrder = () => {
  const [orderIdInput, setOrderIdInput] = useState('');
  const [activeTrackingId, setActiveTrackingId] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef(null);

  // Refresh a successfully retrieved order every 15 seconds.
  useEffect(() => {
    if (!activeTrackingId) return undefined;

    let active = true;

    const intervalId = window.setInterval(async () => {
      try {
        const latestOrder = await fetchTrackedOrder(activeTrackingId);
        if (active) setOrder(latestOrder);
      } catch (error) {
        // Keep the last result visible if a refresh fails temporarily.
        console.error('Could not refresh order status', error);
      }
    }, 15000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [activeTrackingId]);

  useEffect(() => {
    return () => window.clearTimeout(copyTimerRef.current);
  }, []);

  const handleTrack = async (event) => {
    event.preventDefault();
    if (loading) return;

    const trackingId = orderIdInput.trim().toUpperCase();

    if (!trackingId) {
      toast.error('Please enter your tracking ID');
      return;
    }

    if (!TRACKING_ID_PATTERN.test(trackingId)) {
      toast.error('Tracking ID must follow the format UIF-XXXXXX');
      return;
    }

    setOrderIdInput(trackingId);
    setLoading(true);
    setSearchError('');
    setCopied(false);
    setOrder(null);
    setActiveTrackingId('');

    try {
      const result = await fetchTrackedOrder(trackingId);
      setOrder(result);
      setActiveTrackingId(trackingId);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'We could not retrieve your order. Please check your ID and try again.';

      setSearchError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyId = async (id) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy the tracking ID.');
    }
  };

  const orderItems = Array.isArray(order?.items) ? order.items : [];

  const totalQuantity = orderItems.reduce((total, item) => {
    const quantity = Number(item.quantity);
    return total + (Number.isFinite(quantity) ? quantity : 0);
  }, 0);

  // Older single-perfume orders may not contain an items array.
  const legacyQuantity = Number(order?.quantity);
  const displayQuantity = orderItems.length
    ? totalQuantity
    : Number.isFinite(legacyQuantity) && legacyQuantity > 0
      ? legacyQuantity
      : null;

  return (
    <div className="track-order-container">
      <header className="track-header-box">
        <span className="track-tag">Order tracking</span>
        <h1 className="track-main-title">
          Track your <span>order.</span>
        </h1>
        <p className="track-desc">
          Enter the tracking ID from your order confirmation to see its
          latest status.
        </p>
      </header>

      <form className="track-search-form" onSubmit={handleTrack}>
        <div className="search-input-wrapper">
          <svg
            className="search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" strokeWidth="1.8" />
            <path
              d="m21 21-4.35-4.35"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>

          <label className="track-sr-only" htmlFor="tracking-id">
            Tracking ID
          </label>
          <input
            id="tracking-id"
            type="text"
            placeholder="e.g. UIF-4A7K92"
            value={orderIdInput}
            onChange={(event) =>
              setOrderIdInput(event.target.value.toUpperCase())
            }
            maxLength={10}
            spellCheck={false}
            autoComplete="off"
          />
        </div>

        <button type="submit" className="track-submit-btn" disabled={loading}>
          {loading ? (
            <>
              <span className="track-btn-loader" aria-hidden="true" />
              Searching...
            </>
          ) : (
            <>
              Track order
              <span aria-hidden="true">→</span>
            </>
          )}
        </button>
      </form>

      {loading && (
        <div className="track-loading-state" role="status">
          <div className="track-loader" aria-hidden="true" />
          <p>Looking up your order...</p>
        </div>
      )}

      {!loading && order && (
        <section className="track-result-card" aria-label="Order details">
          <div className="card-top-bar">
            <div className="order-id-pill">
              <span className="id-label">Tracking ID</span>
              <strong className="id-code">{order.orderId}</strong>

              <button
                type="button"
                className="copy-btn"
                onClick={() => handleCopyId(order.orderId)}
                aria-label={copied ? 'Tracking ID copied' : 'Copy tracking ID'}
              >
                {copied ? 'Copied ✓' : 'Copy'}
              </button>
            </div>

            <div className={`status-pill ${
              order.trackingType === 'physical' && order.paymentStatus === 'Pending'
                ? 'status-pending'
                : getStatusClass(order.orderStatus)
            }`}>
              <span className="status-dot" aria-hidden="true" />
              {order.trackingType === 'physical'
                ? `Payment: ${order.paymentStatus || order.orderStatus || 'Status unavailable'}`
                : order.orderStatus || 'Status unavailable'}
            </div>
          </div>

          <div className="order-meta-grid">
            <div className="meta-box">
              <span className="meta-label">Fragrance</span>

              {orderItems.length ? (
                <ul className="track-items">
                  {orderItems.map((item, index) => (
                    <li key={`${item.perfumeId || item.perfumeName}-${index}`}>
                      <strong>{item.perfumeName}</strong>
                      <span>
                        Qty {item.quantity}
                        {order.trackingType !== 'physical' && item.unitPrice !== undefined
                          ? ` · ${formatAmount(item.unitPrice)} each`
                          : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="meta-value">{order.selectedPerfume || '—'}</p>
              )}
            </div>

            <div className="meta-box">
              <span className="meta-label">Recipient</span>
              <p className="meta-value">{order.customerName || '—'}</p>
            </div>
            <div className="meta-box">
              <span className="meta-label">Order date</span>
              <p className="meta-value">{formatDate(order.orderDate || order.createdAt)}</p>
            </div>
          </div>

          {order.trackingType === 'physical' ? (
            <div className="financial-strip">
              <div className="strip-item">
                <span className="strip-label">Quantity</span>
                <strong className="strip-val">
                  {displayQuantity === null
                    ? '—'
                    : `${displayQuantity} ${displayQuantity === 1 ? 'bottle' : 'bottles'}`}
                </strong>
              </div>
              <div className="strip-item">
                <span className="strip-label">Payment status</span>
                <strong className="strip-val">{order.paymentStatus || order.orderStatus || '—'}</strong>
              </div>
            </div>
          ) : (
            <>
              <div className="financial-strip">
                <div className="strip-item">
                  <span className="strip-label">Quantity</span>
                  <strong className="strip-val">
                    {displayQuantity === null
                      ? '—'
                      : `${displayQuantity} ${
                          displayQuantity === 1 ? 'bottle' : 'bottles'
                        }`}
                  </strong>
                </div>

                <div className="strip-item">
                  <span className="strip-label">Unit price</span>
                  <strong className="strip-val">
                    {orderItems.length === 1
                      ? formatAmount(orderItems[0].unitPrice)
                      : orderItems.length > 1
                        ? 'See items above'
                        : formatAmount(order.unitPrice)}
                  </strong>
                </div>

                <div className="strip-item">
                  <span className="strip-label">Total amount</span>
                  <strong className="strip-val strip-total">
                    {formatAmount(order.totalAmount)}
                  </strong>
                </div>
              </div>

              <div className="stepper-wrapper-lux">
                <h2 className="stepper-title">Delivery progress</h2>
                <OrderStepper currentStatus={order.orderStatus} />
              </div>
            </>
          )}
        </section>
      )}

      {!loading && searchError && (
        <div className="track-empty-state" role="alert">
          <div className="empty-icon" aria-hidden="true">!</div>
          <h2>Unable to find your order</h2>
          <p>{searchError}</p>
        </div>
      )}
    </div>
  );
};

export default TrackOrder;