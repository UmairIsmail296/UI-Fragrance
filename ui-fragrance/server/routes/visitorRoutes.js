const express = require('express');
const router = express.Router();
const Visitor = require('../models/Visitor');
const Order = require('../models/Order');
const { protectAdmin } = require('../middleware/authMiddleware');

// Extracts the real client IP, respecting a reverse proxy (see
// app.set('trust proxy', true) in server.js) with a manual
// x-forwarded-for fallback for environments where trust proxy isn't set.
const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip;
};

// @route   POST /api/visitors
// @desc    Logs a single page visit. Kept deliberately minimal/fast (one
//          insert, no joins) so it never slows down page loads — and never
//          throws a hard error back to the browser even if logging fails.
// @access  Public
router.post('/visitors', async (req, res) => {
  try {
    const { pageVisited } = req.body;

    // Do NOT log admin page visits
    if (pageVisited && pageVisited.startsWith('/admin')) {
      return res.status(200).json({ message: 'Admin visit ignored' });
    }

    await Visitor.create({
      ipAddress: getClientIp(req),
      pageVisited: pageVisited || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.status(201).json({ message: 'Visit logged' });
  } catch (error) {
    console.error('Failed to log visitor:', error.message);
    res.status(200).json({ message: 'ok' }); // never fail the page load over this
  }
});

// Builds "YYYY-MM-DD" date-key strings for the last `days` days (including
// today), oldest first — used to zero-fill chart days with no data/orders.
const buildDayRange = (days) => {
  const keys = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    keys.push(d.toISOString().slice(0, 10));
  }
  return keys;
};

const formatLabel = (dateKey) => {
  const d = new Date(`${dateKey}T00:00:00`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const startOfDaysAgo = (n) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
};

// @route   GET /api/analytics/sales?range=7|30
// @desc    Daily order counts for the chart
// @access  Private (Admin)
router.get('/analytics/sales', protectAdmin, async (req, res) => {
  try {
    const range = parseInt(req.query.range, 10) === 30 ? 30 : 7;
    const since = startOfDaysAgo(range - 1);

    const grouped = await Order.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
    ]);

    const countsByDay = Object.fromEntries(grouped.map((g) => [g._id, g.count]));
    const days = buildDayRange(range);
    const data = days.map((key) => ({
      date: formatLabel(key),
      orders: countsByDay[key] || 0,
    }));

    res.status(200).json({ range, data });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load sales analytics', error: error.message });
  }
});

// @route   GET /api/analytics/visitors?range=7|30
// @desc    Daily UNIQUE visitor counts (by IP) for the chart
// @access  Private (Admin)
router.get('/analytics/visitors', protectAdmin, async (req, res) => {
  try {
    const range = parseInt(req.query.range, 10) === 30 ? 30 : 7;
    const since = startOfDaysAgo(range - 1);

    const grouped = await Visitor.aggregate([
      { $match: { visitedAt: { $gte: since } } },
      {
        $group: {
          _id: {
            day: { $dateToString: { format: '%Y-%m-%d', date: '$visitedAt' } },
            ip: '$ipAddress',
          },
        },
      },
      {
        $group: {
          _id: '$_id.day',
          uniqueVisitors: { $sum: 1 },
        },
      },
    ]);

    const countsByDay = Object.fromEntries(grouped.map((g) => [g._id, g.uniqueVisitors]));
    const days = buildDayRange(range);
    const data = days.map((key) => ({
      date: formatLabel(key),
      visitors: countsByDay[key] || 0,
    }));

    res.status(200).json({ range, data });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load visitor analytics', error: error.message });
  }
});

// @route   GET /api/analytics/summary
// @desc    Top-line stats for the summary cards
// @access  Private (Admin)
router.get('/analytics/summary', protectAdmin, async (req, res) => {
  try {
    const startOfToday = startOfDaysAgo(0);
    const sevenDaysAgo = startOfDaysAgo(6);
    const thirtyDaysAgo = startOfDaysAgo(29);

    const [todaySales, weekSales, monthSales, revenueAgg, todayVisitorIps, weekVisitorIps, allVisitorIps, pageAgg] =
      await Promise.all([
        Order.countDocuments({ createdAt: { $gte: startOfToday } }),
        Order.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
        Order.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
        Order.aggregate([{ $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
        Visitor.distinct('ipAddress', { visitedAt: { $gte: startOfToday } }),
        Visitor.distinct('ipAddress', { visitedAt: { $gte: sevenDaysAgo } }),
        Visitor.distinct('ipAddress'),
        // Exclude admin pages from most visited calculation
        Visitor.aggregate([
          { $match: { pageVisited: { $not: { $regex: /^\/admin/ } } } },
          { $group: { _id: '$pageVisited', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 1 },
        ]),
      ]);

    res.status(200).json({
      todaySales,
      weekSales,
      monthSales,
      totalRevenue: revenueAgg[0]?.total || 0,
      todayVisitors: todayVisitorIps.length,
      weekVisitors: weekVisitorIps.length,
      totalVisitors: allVisitorIps.length,
      mostVisitedPage: pageAgg[0]?._id || 'N/A',
      mostVisitedPageCount: pageAgg[0]?.count || 0,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load analytics summary', error: error.message });
  }
});

module.exports = router;