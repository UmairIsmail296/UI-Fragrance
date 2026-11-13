const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const Perfume = require('./models/Perfume');
const uploadMiddleware = require('./middleware/uploadMiddleware');

dotenv.config();

const app = express();

// NEW: trust the reverse proxy (e.g. Nginx/Heroku/Render) so req.ip reflects
// the real client IP rather than the proxy's own address — required for
// accurate visitor IP logging in production.
app.set('trust proxy', true);

// Middleware
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:4173',
  'https://www.ui-fragrance.store',
  'https://ui-fragrance.store'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin is not allowed by CORS'));
  },
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/perfumes', require('./routes/perfumeRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
// NEW: visitor logging (POST /api/visitors) + analytics (GET /api/analytics/*)
app.use('/api', require('./routes/visitorRoutes'));
// REMOVED: '/api/payments' mount — payment integration has been fully removed.

const escapeXml = (value) =>
  String(value).replace(/[<>&'"]/g, (character) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;',
  }[character]));

app.get('/sitemap.xml', async (req, res, next) => {
  try {
    const perfumes = await Perfume.find().select('_id').lean();
    const urls = [
      'https://ui-fragrance.store/',
      'https://ui-fragrance.store/shop',
      ...perfumes.map(
        (perfume) =>
          `https://ui-fragrance.store/product/${encodeURIComponent(perfume._id)}`
      ),
    ];
    const sitemap = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...urls.map((url) => `<url><loc>${escapeXml(url)}</loc></url>`),
      '</urlset>',
    ].join('');

    res.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    res.type('application/xml').send(sitemap);
  } catch (error) {
    next(error);
  }
});

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

module.exports = app;