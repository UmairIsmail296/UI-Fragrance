import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import PerfumeManager from '../components/admin/PerfumeManager.jsx';
import OrderManager from '../components/admin/OrderManager.jsx';
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
        <div className="admin-header-brand">UI <span>Fragrance</span> <small>Admin</small></div>
        <div className="admin-header-right">
          <span className="admin-welcome">Welcome, {admin?.username || 'Admin'}</span>
          <button className="btn-outline small" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <div className="container" style={{ paddingTop: 24 }}>
        <AnalyticsDashboard />
      </div>

      <div className="admin-tabs container">
        <button className={`admin-tab ${activeTab === 'perfumes' ? 'active' : ''}`} onClick={() => setActiveTab('perfumes')}>Perfumes</button>
        <button className={`admin-tab ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>Orders</button>
      </div>

      <main className="container admin-main">
        {activeTab === 'perfumes' ? <PerfumeManager /> : <OrderManager />}
      </main>
    </div>
  );
}

export default AdminDashboard;