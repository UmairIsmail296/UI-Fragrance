import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('uif_admin_token') || null);
  const [admin, setAdmin] = useState(() => {
    const stored = localStorage.getItem('uif_admin_info');
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem('uif_admin_token', token);
    } else {
      localStorage.removeItem('uif_admin_token');
    }
  }, [token]);

  const login = (newToken, adminInfo) => {
    setToken(newToken);
    setAdmin(adminInfo);
    localStorage.setItem('uif_admin_token', newToken);
    localStorage.setItem('uif_admin_info', JSON.stringify(adminInfo));
  };

  const logout = () => {
    setToken(null);
    setAdmin(null);
    localStorage.removeItem('uif_admin_token');
    localStorage.removeItem('uif_admin_info');
  };

  const isAuthenticated = Boolean(token);

  return (
    <AuthContext.Provider value={{ token, admin, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
