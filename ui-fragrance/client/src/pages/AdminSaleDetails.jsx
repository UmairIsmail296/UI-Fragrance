import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext.jsx';
import api, { resolveAssetUrl } from '../utils/api.js';
import './AdminSaleDetails.css';

const formatMoney = (value) => `Rs. ${Number(value || 0).toLocaleString('en-PK', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

const formatDate = (value) => (value ? new Date(value).toLocaleDateString(undefined, {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}) : '—');

const AdminSaleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { admin, logout } = useAuth();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    let active = true;
    const loadSale = async () => {
      setLoading(true);
      setSale(null);
      try {
        const response = await api.get(`/perfume-sales/${id}`);
        if (active) setSale(response.data);
      } catch (error) {
        if (active) toast.error(error.response?.data?.message || 'Failed to load sale details');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadSale();
    return () => {
      active = false;
    };
  }, [id]);

  const handlePaymentStatusChange = async (event) => {
    const paymentStatus = event.target.value;
    setUpdatingStatus(true);
    try {
      const response = await api.patch(`/perfume-sales/${id}/payment-status`, { paymentStatus });
      setSale((current) => ({ ...current, paymentStatus: response.data.paymentStatus }));
      window.dispatchEvent(new Event('sales-data-updated'));
      toast.success('Payment status updated');
    } catch (error) {
      setSale((current) => ({ ...current }));
      toast.error(error.response?.data?.message || 'Failed to update payment status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const goBackToSales = () => navigate('/admin/dashboard', { state: { activeTab: 'sales' } });

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="admin-dashboard admin-sale-details">
      <header className="admin-header">
        <div className="admin-header-brand">
          UI <span>Fragrance</span> <small>Admin</small>
        </div>
        <div className="admin-header-right">
          <span className="admin-welcome">Welcome, {admin?.username || 'Admin'}</span>
          <button type="button" className="btn-outline small" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main className="container sale-details-main">
        <button type="button" className="btn-outline sale-details-back" onClick={goBackToSales}>
          <span aria-hidden="true">←</span> Back to Sales Management
        </button>

        {loading ? (
          <div className="spinner-wrap" role="status"><div className="spinner" /></div>
        ) : !sale ? (
          <section className="sale-details-empty">
            <h1>Sale not found</h1>
            <p>This sale may have been removed or the link may be invalid.</p>
            <button type="button" className="btn-gold" onClick={goBackToSales}>Return to Sales</button>
          </section>
        ) : (
          <>
            <div className="sale-details-title-row">
              <div>
                <p className="sale-details-eyebrow">Sales record</p>
                <h1>Sale Details</h1>
                <p className="sale-details-id">Record ID: {sale._id}</p>
              </div>
              <div className="sale-details-status-control">
                <label htmlFor="detail-payment-status">Update payment status</label>
                <select
                  id="detail-payment-status"
                  className={`sale-payment-status-badge ${sale.paymentStatus === 'Paid' ? 'is-paid' : 'is-pending'}`}
                  value={sale.paymentStatus || 'Pending'}
                  onChange={handlePaymentStatusChange}
                  disabled={updatingStatus}
                >
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>

            <section className="sale-details-product">
              {sale.perfumeImage ? (
                <img
                  className="sale-details-product-image"
                  src={resolveAssetUrl(sale.perfumeImage)}
                  alt={sale.perfumeName}
                />
              ) : (
                <div className="sale-details-product-image sale-details-image-placeholder" aria-label="No perfume image available">
                  No image
                </div>
              )}
              <div className="sale-details-product-copy">
                <p className="sale-details-eyebrow">Product</p>
                <h2>{sale.perfumeName}</h2>
                <div className="sale-details-product-stats">
                  <div><span>Quantity sold</span><strong>{sale.quantity}</strong></div>
                  <div><span>Price per unit</span><strong>{formatMoney(sale.sellingPrice)}</strong></div>
                  <div className="sale-details-total"><span>Total sale amount</span><strong>{formatMoney(sale.totalSaleAmount)}</strong></div>
                </div>
              </div>
            </section>

            <div className="sale-details-info-grid">
              <section className="sale-details-card">
                <p className="sale-details-eyebrow">Customer information</p>
                <h2>{sale.customerName || 'Customer not specified'}</h2>
                <dl>
                  <div><dt>Customer name</dt><dd>{sale.customerName || '—'}</dd></div>
                  <div><dt>Phone number</dt><dd>{sale.customerPhone || '—'}</dd></div>
                </dl>
              </section>

              <section className="sale-details-card">
                <p className="sale-details-eyebrow">Sale information</p>
                <h2>Transaction</h2>
                <dl>
                  <div><dt>Sale date</dt><dd>{formatDate(sale.saleDate)}</dd></div>
                  <div>
                    <dt>Payment status</dt>
                    <dd><span className={`sale-status-label ${sale.paymentStatus === 'Paid' ? 'is-paid' : 'is-pending'}`}>{sale.paymentStatus}</span></dd>
                  </div>
                  <div><dt>Sale added by</dt><dd>{sale.addedBy || '—'}</dd></div>
                  <div><dt>Purchase price per unit</dt><dd>{formatMoney(sale.purchasePrice)}</dd></div>
                  <div><dt>Total cost</dt><dd>{formatMoney(sale.totalCost)}</dd></div>
                  <div><dt>Profit</dt><dd>{formatMoney(sale.profit)}</dd></div>
                </dl>
                {sale.notes && (
                  <div className="sale-details-notes">
                    <span>Notes</span>
                    <p>{sale.notes}</p>
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminSaleDetails;
