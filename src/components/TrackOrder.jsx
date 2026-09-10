import React, { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../utils/api.js';
import OrderStepper from './OrderStepper.jsx';
import './TrackOrder.css';

const TRACKING_ID_PATTERN = /^UIF-[A-Z0-9]{6}$/i;

// REMOVED: PAYMENT_METHOD_LABELS / PAYMENT_STATUS_COLORS — payment
// integration has been fully removed, so there's no payment status/method
// to display here anymore.

const TrackOrder = () => {
  const [orderIdInput, setOrderIdInput] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleTrack = async (e) => {
    e.preventDefault();
    const trimmed = orderIdInput.trim();

    if (!trimmed) {
      toast.error('Please enter your Tracking ID');
      return;
    }

    if (!TRACKING_ID_PATTERN.test(trimmed)) {
      toast.error('Tracking ID should look like UIF-4A7K92');
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

  return (
    <div className="track-order-wrap">
      <form className="track-order-form" onSubmit={handleTrack}>
        <input
          type="text"
          placeholder="Enter your Tracking ID (e.g. UIF-4A7K92)"
          value={orderIdInput}
          onChange={(e) => setOrderIdInput(e.target.value)}
        />
        <button type="submit" className="btn-gold" disabled={loading}>
          {loading ? <span className="spinner small"></span> : 'Track'}
        </button>
      </form>

      {loading && (
        <div className="spinner-wrap">
          <div className="spinner"></div>
        </div>
      )}

      {!loading && order && (
        <div className="track-order-result reveal visible">
          <div className="track-order-summary">
            <div>
              <p className="track-label">Tracking ID</p>
              <p className="track-value">{order.orderId}</p>
            </div>
            <div>
              <p className="track-label">Perfume</p>
              <p className="track-value">{order.selectedPerfume}</p>
            </div>
            <div>
              <p className="track-label">Customer</p>
              <p className="track-value">{order.customerName}</p>
            </div>
            <div>
              <p className="track-label">Order Status</p>
              <p className="track-value track-status">{order.orderStatus}</p>
            </div>
            {/* NEW: quantity / unit price / total amount (replaces payment method/status) */}
            <div>
              <p className="track-label">Quantity</p>
              <p className="track-value">{order.quantity}</p>
            </div>
            <div>
              <p className="track-label">Unit Price</p>
              <p className="track-value">Rs. {Number(order.unitPrice).toLocaleString('en-PK')}</p>
            </div>
            <div>
              <p className="track-label">Total Amount</p>
              <p className="track-value track-total">
                Rs. {Number(order.totalAmount).toLocaleString('en-PK')}
              </p>
            </div>
          </div>

          <OrderStepper currentStatus={order.orderStatus} />
        </div>
      )}

      {!loading && !order && searched && (
        <div className="track-order-empty">
          <p>No order found with that ID. Please double-check and try again.</p>
        </div>
      )}
    </div>
  );
};

export default TrackOrder;