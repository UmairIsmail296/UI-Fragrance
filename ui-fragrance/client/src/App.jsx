import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Analytics } from '@vercel/analytics/react';


import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import WhatsAppIcon from './components/WhatsAppIcon.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';
import ProtectedAdminRoute from './components/ProtectedAdminRoute.jsx';
import { CartProvider } from './context/CartContext.jsx'; // NEW (Change 3): replaces OrderFormProvider
import api from './utils/api.js';
// REMOVED: OrderForm / OrderFormContext — the order-form drawer flow has
// been fully replaced by the Cart → Checkout → Order Success flow below.

import Home from './pages/Home.jsx';
import Shop from './pages/Shop.jsx';
import PerfumeDetail from './pages/PerfumeDetail.jsx';
import AboutUs from './pages/AboutUs.jsx';
import TrackOrderPage from './pages/TrackOrderPage.jsx';
import CartPage from './pages/CartPage.jsx'; // NEW
import CheckoutPage from './pages/CheckoutPage.jsx'; // NEW
import OrderSuccessPage from './pages/OrderSuccessPage.jsx'; // NEW
import AdminLogin from './pages/AdminLogin.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

const PublicLayout = ({ children }) => (
  <>
    <Navbar />
    {children}
    <Footer />
    <WhatsAppIcon />
    
  </>
);

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  // UPDATED (Change 1): admin pages are now excluded from visitor tracking
  // entirely — the request isn't even sent, so they can never pollute
  // "Most Visited Page" or the visitor counts (the backend also
  // independently guards against this — see server/routes/visitorRoutes.js).
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/admin')) return; // Skip admin pages

    api.post('/visitors', { pageVisited: path }).catch(() => {
      // intentionally silent — visitor logging must never surface an error to the user
    });
  }, [location.pathname]);

  return (
    <CartProvider>
      <ScrollToTop />
      <ToastContainer
        position="top-right"
        autoClose={4000}
        theme="dark"
        toastStyle={{ fontFamily: "'Poppins', sans-serif", fontSize: '0.85rem' }}
      />
      <Analytics />

      {isAdminRoute ? (
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            }
          />
        </Routes>
      ) : (
        <PublicLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/perfume/:id" element={<PerfumeDetail />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/track-order" element={<TrackOrderPage />} />
            {/* NEW: cart / checkout / order success routes (Change 3) */}
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-success" element={<OrderSuccessPage />} />
            <Route
              path="*"
              element={
                <div className="container text-center" style={{ padding: '140px 0' }}>
                  <h2 className="section-title">
                    404 — Page <span>Not Found</span>
                  </h2>
                </div>
              }
            />
          </Routes>
        </PublicLayout>
      )}
    </CartProvider>
  );
}

export default App;