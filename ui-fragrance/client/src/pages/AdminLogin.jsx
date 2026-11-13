import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import './AdminLogin.css';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      toast.error('Please enter both username and password');
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post('/admin/login', {
        username,
        password,
      });

      login(data.token, data.admin);
      toast.success('Login successful');
      navigate('/admin/dashboard');
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-login-page">
      <form className="admin-login-card" onSubmit={handleSubmit}>
        <div className="admin-login-header">
          <p className="admin-login-eyebrow">ADMIN PORTAL</p>

          <h1>
            UI <span>Fragrance</span>
          </h1>

          <p className="admin-login-subtitle">
            Sign in to manage your dashboard.
          </p>
        </div>

        <div className="admin-login-field">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            autoComplete="username"
          />
        </div>

        <div className="admin-login-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          className="admin-login-button"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="admin-login-spinner" aria-hidden="true" />
              Signing in...
            </>
          ) : (
            'Sign in'
          )}
        </button>
      </form>
    </main>
  );
};

export default AdminLogin;