const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const uploadMiddleware = require('./middleware/uploadMiddleware');

dotenv.config();
connectDB();

const app = express();

// NEW: trust the reverse proxy (e.g. Nginx/Heroku/Render) so req.ip reflects
// the real client IP rather than the proxy's own address — required for
// accurate visitor IP logging in production.
app.set('trust proxy', true);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/perfumes', require('./routes/perfumeRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
// NEW: visitor logging (POST /api/visitors) + analytics (GET /api/analytics/*)
app.use('/api', require('./routes/visitorRoutes'));
// REMOVED: '/api/payments' mount — payment integration has been fully removed.

app.get('/', (req, res) => {
  res.send('UI Fragrance API is running...');
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  // Multer file size limits trigger an error with code 'LIMIT_FILE_SIZE'
  if (err && (err.code === 'LIMIT_FILE_SIZE' || err.name === 'MulterError')) {
    const maxBytes = uploadMiddleware?.MAX_FILE_SIZE_BYTES || 0;
    const maxMb = maxBytes ? Math.round(maxBytes / (1024 * 1024)) : 'unknown';
    return res.status(413).json({
      message: `Uploaded file is too large. Maximum allowed size is ${maxMb} MB.`,
    });
  }

  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
});

const PORT = process.env.PORT || 5000;

// Sirf local chalane ke liye (Vercel par ye automatic handle hota hai)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Vercel serverless function ke liye export lazmi hai
module.exports = app;