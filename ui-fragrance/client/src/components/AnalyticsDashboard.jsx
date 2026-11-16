import React, { useEffect, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import api from '../utils/api.js';
import './AnalyticsDashboard.css';

const formatMoney = (value) => `Rs. ${Number(value || 0).toLocaleString('en-PK', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

const formatAxisMoney = (value) => `Rs. ${Number(value || 0).toLocaleString('en-PK')}`;

const AnalyticsTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="analytics-tooltip">
      <p className="analytics-tooltip-label">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="analytics-tooltip-value">
          <span className={`analytics-tooltip-dot ${entry.dataKey}`} />
          {entry.name}: <strong>{formatMoney(entry.value)}</strong>
        </p>
      ))}
    </div>
  );
};

const AnalyticsDashboard = () => {
  const [period, setPeriod] = useState('daily');
  const [salesData, setSalesData] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    let initialLoad = true;

    const fetchSales = async () => {
      if (initialLoad) setLoading(true);
      setError(false);

      try {
        const { data } = await api.get('/analytics/sales', { params: { period } });
        if (!Array.isArray(data?.data) || !Number.isFinite(Number(data.totalRevenue))) {
          throw new Error('Sales analytics response is invalid');
        }
        if (!active) return;
        setSalesData(data.data);
        setTotalRevenue(Number(data.totalRevenue));
      } catch (fetchError) {
        console.error('Failed to load sales analytics', fetchError);
        if (active) setError(true);
      } finally {
        if (active && initialLoad) {
          initialLoad = false;
          setLoading(false);
        }
      }
    };

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') fetchSales();
    };

    fetchSales();
    const intervalId = window.setInterval(fetchSales, 30_000);
    window.addEventListener('focus', fetchSales);
    window.addEventListener('sales-data-updated', fetchSales);
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', fetchSales);
      window.removeEventListener('sales-data-updated', fetchSales);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [period, refreshKey]);

  return (
    <section className="analytics-dashboard" aria-labelledby="analytics-title">
      <div className="analytics-header">
        <div>
          <span className="analytics-eyebrow">Sales performance</span>
          <h2 id="analytics-title">Sales Analytics</h2>
        </div>
        <div className="analytics-revenue" aria-live="polite">
          <span>Total Revenue</span>
          <strong>{loading ? 'Loading...' : error ? 'Unavailable' : formatMoney(totalRevenue)}</strong>
        </div>
      </div>

      <div className="analytics-chart-card">
        <div className="analytics-chart-heading">
          <div>
            <h3>Online vs Physical Sales</h3>
            <p>Revenue by sales channel</p>
          </div>
          <div className="analytics-range-toggle" role="group" aria-label="Sales chart period">
            {[
              ['daily', 'Daily'],
              ['weekly', 'Weekly'],
              ['monthly', 'Monthly'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={period === value ? 'active' : ''}
                onClick={() => setPeriod(value)}
                aria-pressed={period === value}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="analytics-loading" role="status">
            <div className="analytics-spinner" aria-hidden="true" />
            <span>Loading sales analytics...</span>
          </div>
        ) : error ? (
          <div className="analytics-error" role="alert">
            <p>Sales analytics could not be loaded.</p>
            <button type="button" onClick={() => setRefreshKey((key) => key + 1)}>
              Try again
            </button>
          </div>
        ) : (
          <div className="analytics-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData} margin={{ top: 12, right: 18, left: 12, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6eee8" />
                <XAxis
                  dataKey="date"
                  stroke="#718177"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={18}
                />
                <YAxis
                  stroke="#718177"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatAxisMoney}
                  width={82}
                />
                <Tooltip content={<AnalyticsTooltip />} />
                <Legend verticalAlign="top" height={36} />
                <Line
                  type="monotone"
                  dataKey="onlineSales"
                  name="Online Sales"
                  stroke="#277a53"
                  strokeWidth={3}
                  dot={{ fill: '#277a53', r: 3 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="physicalSales"
                  name="Physical Sales"
                  stroke="#c28a45"
                  strokeWidth={3}
                  dot={{ fill: '#c28a45', r: 3 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </section>
  );
};

export default AnalyticsDashboard;
