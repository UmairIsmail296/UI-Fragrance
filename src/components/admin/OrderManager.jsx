import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api.js';

const STATUS_OPTIONS = [
  'Order Placed',
  'Order Confirmed',
  'Dispatched',
  'Out for Delivery',
  'Delivered',
];

// Builds "Velvet Oud Royale ×2, Midnight Rose ×1" for the collapsed row
const summarizeItems = (items = []) =>
  items.map((item) => `${item.perfumeName} ×${item.quantity}`).join(', ');

const OrderManager = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null); // NEW (Change 3): expand-to-see-all-items

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/orders');
      setOrders(data);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await api.put(`/orders/${orderId}/status`, { orderStatus: newStatus });
      toast.success('Order status updated');
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, orderStatus: newStatus } : o))
      );
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleExpand = (orderId) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  const requestDelete = (order) => setOrderToDelete(order);

  const cancelDelete = () => {
    if (deleting) return;
    setOrderToDelete(null);
  };

  const confirmDelete = async () => {
    if (!orderToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/orders/${orderToDelete._id}`);
      toast.success('Order deleted successfully.');
      setOrders((prev) => prev.filter((o) => o._id !== orderToDelete._id));
      setOrderToDelete(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete order');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2>Order Management</h2>
        <button className="btn-outline small" onClick={fetchOrders}>
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="spinner-wrap">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th></th>
                <th>Tracking ID</th>
                <th>Customer</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>City</th>
                <th>Area</th>
                {/* UPDATED (Change 3): single "Items" column replaces the old
                    Perfume / Quantity / Unit Price columns — click to expand */}
                <th>Items</th>
                <th>Total Amount</th>
                <th>Date</th>
                <th>Order Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const isExpanded = expandedOrderId === order._id;
                return (
                  <React.Fragment key={order._id}>
                    <tr>
                      <td>
                        <button
                          type="button"
                          className="expand-toggle-btn"
                          onClick={() => toggleExpand(order._id)}
                          aria-label={isExpanded ? 'Collapse items' : 'Expand items'}
                        >
                          {isExpanded ? '−' : '+'}
                        </button>
                      </td>
                      <td className="mono">{order.orderId}</td>
                      <td>{order.customerName}</td>
                      <td>{order.customerEmail}</td>
                      <td>{order.customerMobile}</td>
                      <td>{order.customerCity}</td>
                      <td>{order.customerArea}</td>
                      <td className="items-summary-cell" title={summarizeItems(order.items)}>
                        {summarizeItems(order.items)}
                      </td>
                      <td>Rs. {Number(order.totalAmount).toLocaleString('en-PK')}</td>
                      <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td>
                        <select
                          value={order.orderStatus}
                          disabled={updatingId === order._id}
                          onChange={(e) => handleStatusChange(order._id, e.target.value)}
                          className="status-select"
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button
                          className="btn-danger small"
                          onClick={() => requestDelete(order)}
                          aria-label={`Delete order ${order.orderId}`}
                        >
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style={{ marginRight: 4, verticalAlign: '-2px' }}>
                            <path d="M9 3a1 1 0 0 0-1 1v1H4a1 1 0 1 0 0 2h1v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7h1a1 1 0 1 0 0-2h-4V4a1 1 0 0 0-1-1H9zm1 2h4v0h-4zM7 7h10v13H7V7zm3 2a1 1 0 0 0-1 1v7a1 1 0 1 0 2 0v-7a1 1 0 0 0-1-1zm4 0a1 1 0 0 0-1 1v7a1 1 0 1 0 2 0v-7a1 1 0 0 0-1-1z" />
                          </svg>
                          Delete
                        </button>
                      </td>
                    </tr>
                    {/* NEW: expanded itemized breakdown row */}
                    {isExpanded && (
                      <tr className="items-expanded-row">
                        <td></td>
                        <td colSpan={10}>
                          <table className="items-detail-table">
                            <thead>
                              <tr>
                                <th>Perfume</th>
                                <th>Qty</th>
                                <th>Unit Price</th>
                                <th>Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(order.items || []).map((item, idx) => (
                                <tr key={item.perfumeId || idx}>
                                  <td>{item.perfumeName}</td>
                                  <td>{item.quantity}</td>
                                  <td>Rs. {Number(item.unitPrice).toLocaleString('en-PK')}</td>
                                  <td>Rs. {Number(item.subtotal).toLocaleString('en-PK')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={11} className="text-center">No orders placed yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {orderToDelete && (
        <div className="confirm-modal-overlay" onClick={cancelDelete}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete this order?</h3>
            <p>
              Are you sure you want to delete order{' '}
              <strong className="mono">{orderToDelete.orderId}</strong>? This action cannot be
              undone.
            </p>
            <div className="confirm-modal-actions">
              <button className="btn-modal-cancel" onClick={cancelDelete} disabled={deleting}>
                Cancel
              </button>
              <button className="btn-modal-delete" onClick={confirmDelete} disabled={deleting}>
                {deleting ? <span className="spinner small"></span> : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManager;