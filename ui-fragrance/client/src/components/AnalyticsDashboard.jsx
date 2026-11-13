import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '../utils/api.js';
import './AnalyticsDashboard.css';

const CartIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
    <path d="M7 4h-2l-1 2H2v2h2l3.6 7.59-1.35 2.44A2 2 0 0 0 8 21h12v-2H8l1.1-2h7.45a2 2 0 0 0 1.8-1.11L21.8 8H6.21l-.94-2H7V4zm-1 15a2 2 0 1 0 2 2 2 2 0 0 0-2-2zm10 0a2 2 0 1 0 2 2 2 2 0 0 0-2-2z" />
  </svg>
);

const MoneyIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm.5 15.5v1h-1v-1c-1.2-.2-2.27-.83-2.9-1.85l1.16-.68c.44.72 1.24 1.2 2.24 1.2 1.07 0 1.9-.53 1.9-1.34 0-.7-.55-1.1-1.9-1.44-1.9-.47-3.2-1.16-3.2-2.75 0-1.24 1-2.13 2.4-2.36V7h1v1c1.02.18 1.83.72 2.32 1.5l-1.14.72c-.36-.55-1-.9-1.78-.9-.96 0-1.66.47-1.66 1.2 0 .66.55 1 1.86 1.34 1.98.5 3.24 1.18 3.24 2.83 0 1.35-1.08 2.24-2.54 2.41z" />
  </svg>
);

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
    <path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12a5 5 0 1 1 5-5 5 5 0 0 1-5 5zm0-8a3 3 0 1 0 3 3 3 3 0 0 0-3-3z" />
  </svg>
);

const ChartIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
    <path d="M5 9.2h3V19H5zm5.6-4.4h2.8V19h-2.8zm5.6 8h2.8V19h-2.8z" />
  </svg>
);

const AnalyticsTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="analytics-tooltip">
      <p className="analytics-tooltip-label">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="analytics-tooltip-value">
          {entry.name}: <strong>{entry.value}</strong>
        </p>
      ))}
    </div>
  );
};

const SummaryCard = ({ icon, label, value }) => (
  <div className="analytics-card">
    <div className="analytics-card-icon">{icon}</div>
    <div className="analytics-card-content">
      <p className="analytics-card-label">{label}</p>
      <p className="analytics-card-value">{value}</p>
    </div>
  </div>
);

const AnalyticsDashboard = () => {
  const [range, setRange] = useState(7);
  const [salesData, setSalesData] = useState([]);
  const [visitorData, setVisitorData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let current = true;

    const fetchAll = async () => {
      setLoading(true);
      setError(false);

      try {
        const [salesRes, visitorsRes, summaryRes] = await Promise.all([
          api.get(`/analytics/sales?range=${range}`),
          api.get(`/analytics/visitors?range=${range}`),
          api.get('/analytics/summary'),
        ]);

        if (!current) return;

        setSalesData(
          Array.isArray(salesRes.data?.data) ? salesRes.data.data : []
        );
        setVisitorData(
          Array.isArray(visitorsRes.data?.data) ? visitorsRes.data.data : []
        );
        setSummary(
          summaryRes.data && typeof summaryRes.data === 'object'
            ? summaryRes.data
            : null
        );
      } catch (err) {
        console.error('Failed to load analytics', err);
        if (current) setError(true);
      } finally {
        if (current) setLoading(false);
      }
    };

    fetchAll();

    return () => {
      current = false;
    };
  }, [range, refreshKey]);

  return (
    <section className="analytics-dashboard" aria-labelledby="analytics-title">
      <div className="analytics-header">
        <div>
          <span className="analytics-eyebrow">Dashboard</span>
          <h2 id="analytics-title">Analytics Overview</h2>
        </div>

        <div className="analytics-range-toggle" role="group" aria-label="Analytics date range">
          <button
            type="button"
            className={range === 7 ? 'active' : ''}
            onClick={() => setRange(7)}
            aria-pressed={range === 7}
          >
            Last 7 days
          </button>
          <button
            type="button"
            className={range === 30 ? 'active' : ''}
            onClick={() => setRange(30)}
            aria-pressed={range === 30}
          >
            Last 30 days
          </button>
        </div>
      </div>

      {loading ? (
        <div className="analytics-loading" role="status">
          <div className="analytics-spinner" aria-hidden="true" />
          <span>Loading analytics...</span>
        </div>
      ) : error || !summary ? (
        <div className="analytics-error" role="alert">
          <p>Analytics could not be loaded.</p>
          <button type="button" onClick={() => setRefreshKey((key) => key + 1)}>
            Try again
          </button>
        </div>
      ) : (
        <>
          <div className="analytics-cards-grid">
            <SummaryCard icon={<CartIcon />} label="Today's Sales" value={summary.todaySales} />
            <SummaryCard icon={<CartIcon />} label="This Week's Sales" value={summary.weekSales} />
            <SummaryCard icon={<CartIcon />} label="This Month's Sales" value={summary.monthSales} />
            <SummaryCard
              icon={<MoneyIcon />}
              label="Total Revenue"
              value={`Rs. ${Number(summary.totalRevenue).toLocaleString('en-PK')}`}
            />
            <SummaryCard icon={<EyeIcon />} label="Today's Visitors" value={summary.todayVisitors} />
            <SummaryCard icon={<EyeIcon />} label="This Week's Visitors" value={summary.weekVisitors} />
            <SummaryCard icon={<EyeIcon />} label="Total Visitors (All Time)" value={summary.totalVisitors} />
            <SummaryCard
              icon={<ChartIcon />}
              label="Most Visited Page"
              value={`${summary.mostVisitedPage} (${summary.mostVisitedPageCount})`}
            />
          </div>

          <div className="analytics-charts-grid">
            <div className="analytics-chart-card">
              <h3>Daily Sales</h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart
                  data={salesData}
                  margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#dce9df" />
                  <XAxis dataKey="date" stroke="#6d7f72" fontSize={12} />
                  <YAxis stroke="#6d7f72" fontSize={12} allowDecimals={false} />
                  <Tooltip content={<AnalyticsTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    name="Orders"
                    stroke="#174b35"
                    strokeWidth={2.5}
                    dot={{ fill: '#174b35', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="analytics-chart-card">
              <h3>Daily Unique Visitors</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={visitorData}
                  margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#dce9df" />
                  <XAxis dataKey="date" stroke="#6d7f72" fontSize={12} />
                  <YAxis stroke="#6d7f72" fontSize={12} allowDecimals={false} />
                  <Tooltip content={<AnalyticsTooltip />} />
                  <Bar
                    dataKey="visitors"
                    name="Visitors"
                    fill="#39805a"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default AnalyticsDashboard;