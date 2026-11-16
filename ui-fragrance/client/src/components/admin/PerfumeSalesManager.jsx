import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api.js';

const todayString = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

const emptyForm = () => ({
  perfumeId: '',
  manualPerfumeName: '',
  quantity: '1',
  purchasePrice: '',
  sellingPrice: '',
  saleDate: todayString(),
  customerName: '',
  notes: '',
});

const getRangeDates = (range) => {
  if (range === 'all' || range === 'custom') return {};
  const today = new Date();
  const to = todayString();
  if (range === 'today') return { from: to, to };

  const fromDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (range === 'week') {
    const daysSinceMonday = (fromDate.getDay() + 6) % 7;
    fromDate.setDate(fromDate.getDate() - daysSinceMonday);
  } else {
    fromDate.setDate(1);
  }
  const from = `${fromDate.getFullYear()}-${String(fromDate.getMonth() + 1).padStart(2, '0')}-${String(fromDate.getDate()).padStart(2, '0')}`;
  return { from, to };
};

const formatMoney = (value) => `Rs. ${Number(value || 0).toLocaleString('en-PK', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
};

const PerfumeSalesManager = () => {
  const [sales, setSales] = useState([]);
  const [perfumes, setPerfumes] = useState([]);
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalPerfumesSold: 0,
    totalRevenue: 0,
    totalProfit: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [range, setRange] = useState('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [search, setSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const filters = useMemo(() => {
    if (range === 'custom') return { from: customFrom, to: customTo };
    return getRangeDates(range);
  }, [range, customFrom, customTo]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const params = { search: search.trim() };
        if (filters.from) params.from = filters.from;
        if (filters.to) params.to = filters.to;
        const [salesResponse, perfumesResponse] = await Promise.all([
          api.get('/perfume-sales', { params }),
          api.get('/perfumes'),
        ]);
        if (!active) return;
        setSales(Array.isArray(salesResponse.data.sales) ? salesResponse.data.sales : []);
        setSummary(salesResponse.data.summary || {
          totalSales: 0,
          totalPerfumesSold: 0,
          totalRevenue: 0,
          totalProfit: 0,
        });
        setPerfumes(Array.isArray(perfumesResponse.data) ? perfumesResponse.data : []);
      } catch (error) {
        if (active) toast.error(error.response?.data?.message || 'Failed to load sales data');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [filters, search, refreshKey]);

  const selectedPerfume = perfumes.find((perfume) => perfume._id === form.perfumeId);
  const quantity = Number(form.quantity) || 0;
  const purchasePrice = Number(form.purchasePrice) || 0;
  const sellingPrice = Number(form.sellingPrice) || 0;
  const totalAmount = Math.round((sellingPrice + Number.EPSILON) * 100) / 100 * quantity;
  const totalCost = Math.round((purchasePrice + Number.EPSILON) * 100) / 100 * quantity;
  const profit = totalAmount - totalCost;

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleEdit = (sale) => {
    const matchedPerfume = perfumes.find((perfume) => perfume._id === sale.perfumeId);
    setForm({
      perfumeId: matchedPerfume?._id || '',
      manualPerfumeName: matchedPerfume ? '' : sale.perfumeName,
      quantity: String(sale.quantity),
      purchasePrice: String(sale.purchasePrice),
      sellingPrice: String(sale.sellingPrice),
      saleDate: new Date(sale.saleDate).toISOString().slice(0, 10),
      customerName: sale.customerName || '',
      notes: sale.notes || '',
    });
    setEditingId(sale._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const perfumeName = selectedPerfume?.name || form.manualPerfumeName.trim();
    const parsedQuantity = Number(form.quantity);
    const parsedPurchasePrice = Number(form.purchasePrice);
    const parsedSellingPrice = Number(form.sellingPrice);
    if (!perfumeName) {
      toast.error('Select a perfume or enter its name');
      return;
    }
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
      toast.error('Quantity must be a positive whole number');
      return;
    }
    if (
      form.purchasePrice === '' ||
      form.sellingPrice === '' ||
      !Number.isFinite(parsedPurchasePrice) ||
      parsedPurchasePrice < 0 ||
      !Number.isFinite(parsedSellingPrice) ||
      parsedSellingPrice < 0
    ) {
      toast.error('Enter valid non-negative purchase and selling prices');
      return;
    }
    if (!form.saleDate) {
      toast.error('Sale date is required');
      return;
    }

    const payload = {
      perfumeName,
      ...(selectedPerfume && { perfumeId: selectedPerfume._id }),
      quantity: parsedQuantity,
      purchasePrice: parsedPurchasePrice,
      sellingPrice: parsedSellingPrice,
      saleDate: form.saleDate,
      customerName: form.customerName,
      notes: form.notes,
    };
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/perfume-sales/${editingId}`, payload);
        toast.success('Sale updated successfully');
      } else {
        await api.post('/perfume-sales', payload);
        toast.success('Sale added successfully');
      }
      resetForm();
      setRefreshKey((key) => key + 1);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save sale');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (sale) => {
    if (!window.confirm(`Delete the sale record for ${sale.perfumeName}?`)) return;
    try {
      await api.delete(`/perfume-sales/${sale._id}`);
      toast.success('Sale deleted successfully');
      setRefreshKey((key) => key + 1);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete sale');
    }
  };

  return (
    <section className="admin-section perfume-sales-section">
      <div className="admin-section-header">
        <h2>Perfume Sales Management</h2>
        <button
          type="button"
          className="btn-gold"
          onClick={() => (showForm ? resetForm() : setShowForm(true))}
        >
          {showForm ? 'Cancel' : '+ Add New Sale'}
        </button>
      </div>

      <div className="perfume-sales-summary" aria-live="polite">
        <div className="perfume-sales-stat">
          <span>Total Sales</span>
          <strong>{summary.totalSales}</strong>
        </div>
        <div className="perfume-sales-stat">
          <span>Total Perfumes Sold</span>
          <strong>{summary.totalPerfumesSold}</strong>
        </div>
        <div className="perfume-sales-stat">
          <span>Total Revenue</span>
          <strong>{formatMoney(summary.totalRevenue)}</strong>
        </div>
        <div className="perfume-sales-stat">
          <span>Total Profit</span>
          <strong>{formatMoney(summary.totalProfit)}</strong>
        </div>
      </div>

      {showForm && (
        <form className="admin-form perfume-sale-form" onSubmit={handleSubmit}>
          <h3>{editingId ? 'Edit Sale' : 'Add New Sale'}</h3>
          <div className="admin-form-grid">
            <div className="form-group">
              <label htmlFor="sale-perfume">Perfume Name *</label>
              <select
                id="sale-perfume"
                name="perfumeId"
                value={form.perfumeId}
                onChange={(event) => setForm((previous) => ({
                  ...previous,
                  perfumeId: event.target.value,
                  manualPerfumeName: '',
                }))}
              >
                <option value="">Enter a perfume name manually</option>
                {perfumes.map((perfume) => (
                  <option key={perfume._id} value={perfume._id}>
                    {perfume.name}
                  </option>
                ))}
              </select>
              {!form.perfumeId && (
                <input
                  name="manualPerfumeName"
                  value={form.manualPerfumeName}
                  onChange={handleChange}
                  placeholder="Perfume name"
                  aria-label="Manual perfume name"
                  required
                />
              )}
            </div>
            <div className="form-group">
              <label htmlFor="sale-quantity">Quantity Sold *</label>
              <input id="sale-quantity" name="quantity" type="number" min="1" step="1" value={form.quantity} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="sale-purchase-price">Purchase Price per Perfume (Rs.) *</label>
              <input id="sale-purchase-price" name="purchasePrice" type="number" min="0" step="0.01" value={form.purchasePrice} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="sale-selling-price">Selling Price per Perfume (Rs.) *</label>
              <input id="sale-selling-price" name="sellingPrice" type="number" min="0" step="0.01" value={form.sellingPrice} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="sale-total-amount">Total Sale Amount</label>
              <input id="sale-total-amount" value={formatMoney(totalAmount)} readOnly />
            </div>
            <div className="form-group">
              <label htmlFor="sale-total-cost">Total Cost</label>
              <input id="sale-total-cost" value={formatMoney(totalCost)} readOnly />
            </div>
            <div className="form-group">
              <label htmlFor="sale-profit">Profit</label>
              <input id="sale-profit" className={profit < 0 ? 'perfume-sale-loss' : ''} value={formatMoney(profit)} readOnly />
            </div>
            <div className="form-group">
              <label htmlFor="sale-date">Sale Date *</label>
              <input id="sale-date" name="saleDate" type="date" value={form.saleDate} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="sale-customer">Customer Name (optional)</label>
              <input id="sale-customer" name="customerName" value={form.customerName} onChange={handleChange} />
            </div>
            <div className="form-group admin-form-full">
              <label htmlFor="sale-notes">Notes (optional)</label>
              <textarea id="sale-notes" name="notes" rows="3" value={form.notes} onChange={handleChange} />
            </div>
          </div>
          <div className="perfume-sale-form-actions">
            <button type="submit" className="btn-gold" disabled={saving}>
              {saving ? <span className="spinner small" /> : editingId ? 'Save Changes' : 'Add Sale'}
            </button>
            <button type="button" className="btn-outline" onClick={resetForm} disabled={saving}>Cancel</button>
          </div>
        </form>
      )}

      <div className="perfume-sales-filters">
        <div className="form-group">
          <label htmlFor="sale-period">Date range</label>
          <select
            id="sale-period"
            value={range}
            onChange={(event) => setRange(event.target.value)}
          >
            <option value="all">All dates</option>
            <option value="today">Today</option>
            <option value="week">This week</option>
            <option value="month">This month</option>
            <option value="custom">Custom range</option>
          </select>
        </div>
        {range === 'custom' && (
          <>
            <div className="form-group">
              <label htmlFor="sale-from">From</label>
              <input id="sale-from" type="date" value={customFrom} onChange={(event) => setCustomFrom(event.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="sale-to">To</label>
              <input id="sale-to" type="date" value={customTo} onChange={(event) => setCustomTo(event.target.value)} />
            </div>
          </>
        )}
        <div className="form-group perfume-sales-search">
          <label htmlFor="sale-search">Search perfume</label>
          <input
            id="sale-search"
            type="search"
            placeholder="Search by perfume name"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="spinner-wrap" role="status"><div className="spinner" /></div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table perfume-sales-table">
            <thead>
              <tr>
                <th>Perfume Name</th>
                <th>Quantity</th>
                <th>Purchase Price</th>
                <th>Selling Price</th>
                <th>Total Amount</th>
                <th>Total Cost</th>
                <th>Profit</th>
                <th>Sale Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale._id}>
                  <td title={sale.notes || undefined}>{sale.perfumeName}</td>
                  <td>{sale.quantity}</td>
                  <td>{formatMoney(sale.purchasePrice)}</td>
                  <td>{formatMoney(sale.sellingPrice)}</td>
                  <td>{formatMoney(sale.totalSaleAmount)}</td>
                  <td>{formatMoney(sale.totalCost)}</td>
                  <td className={sale.profit < 0 ? 'perfume-sale-loss' : 'perfume-sale-profit'}>{formatMoney(sale.profit)}</td>
                  <td>{formatDate(sale.saleDate)}</td>
                  <td>
                    <div className="admin-table-actions">
                      <button type="button" className="btn-outline small" onClick={() => handleEdit(sale)}>Edit</button>
                      <button type="button" className="btn-danger small" onClick={() => handleDelete(sale)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr><td colSpan={9} className="text-center">No perfume sales found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default PerfumeSalesManager;
