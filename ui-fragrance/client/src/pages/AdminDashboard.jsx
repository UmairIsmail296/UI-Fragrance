import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import PerfumeManager from '../components/admin/PerfumeManager.jsx';
import OrderManager from '../components/admin/OrderManager.jsx';
import ReviewManager from '../components/admin/ReviewManager.jsx';
import AnalyticsDashboard from '../components/AnalyticsDashboard.jsx';
import './AdminDashboard.css';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('perfumes');
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/admin/login');
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-header-brand">
          UI <span>Fragrance</span> <small>Admin</small>
        </div>

        <div className="admin-header-right">
          <span className="admin-welcome">
            Welcome, {admin?.username || 'Admin'}
          </span>
          <button
            type="button"
            className="btn-outline small"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      <div className="container admin-analytics">
        <AnalyticsDashboard />
      </div>

      <nav className="admin-tabs container" aria-label="Admin sections">
        <button
          type="button"
          className={`admin-tab ${activeTab === 'perfumes' ? 'active' : ''}`}
          onClick={() => setActiveTab('perfumes')}
          aria-current={activeTab === 'perfumes' ? 'page' : undefined}
        >
          Perfumes
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
          aria-current={activeTab === 'orders' ? 'page' : undefined}
        >
          Orders
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
          aria-current={activeTab === 'reviews' ? 'page' : undefined}
        >
          Reviews
        </button>
      </nav>

      <main className="container admin-main">
        {activeTab === 'perfumes' && <PerfumeManager />}
        {activeTab === 'orders' && <OrderManager />}
        {activeTab === 'reviews' && <ReviewManager />}
      </main>
    </div>
  );
}

export default AdminDashboard;