const app = require('../server');
const connectDB = require('../config/db');

const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://ui-fragrance.vercel.app',
].filter(Boolean);

const setCorsHeaders = (req, res) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

module.exports = async (req, res) => {
  try {
    setCorsHeaders(req, res);

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      return res.end();
    }

    await connectDB();
    return app(req, res);
  } catch (error) {
    setCorsHeaders(req, res);
    console.error('Failed to initialize API:', error.message);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    const message = error.message === 'MONGODB_URI is missing or empty in the server environment'
      ? error.message
      : 'Failed to connect to the database';
    return res.end(JSON.stringify({ message }));
  }
};