import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
});

// Attach admin JWT token to requests when available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('uif_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global response interceptor: if a request returns 401, clear stored admin token
// and redirect to admin login so the user can re-authenticate.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      try {
        localStorage.removeItem('uif_admin_token');
        localStorage.removeItem('uif_admin_info');
      } catch (e) {
        // ignore
      }
      // Redirect to admin login page
      if (typeof window !== 'undefined') window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export default api;
