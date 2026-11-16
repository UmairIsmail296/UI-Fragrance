const express = require('express');
const router = express.Router();
const Visitor = require('../models/Visitor');
const Order = require('../models/Order');
const PerfumeSale = require('../models/PerfumeSale');
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

const formatDateKey = (date) => date.toISOString().slice(0, 10);

const getSalesPeriod = (period, now = new Date()) => {
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  if (period === 'daily') {
    const first = new Date(today);
    first.setUTCDate(first.getUTCDate() - 29);
    return {
      first,
      keys: Array.from({ length: 30 }, (_, index) => {
        const date = new Date(first);
        date.setUTCDate(date.getUTCDate() + index);
        return formatDateKey(date);
      }),
      bucketKey: (dateKey) => dateKey,
      label: (key) => formatLabel(key),
    };
  }

  if (period === 'weekly') {
    const currentMonday = new Date(today);
    currentMonday.setUTCDate(currentMonday.getUTCDate() - ((currentMonday.getUTCDay() + 6) % 7));
    const first = new Date(currentMonday);
    first.setUTCDate(first.getUTCDate() - 77);
    const keys = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(first);
      date.setUTCDate(date.getUTCDate() + index * 7);
      return formatDateKey(date);
    });
    return {
      first,
      keys,
      bucketKey: (dateKey) => {
        const date = new Date(`${dateKey}T00:00:00.000Z`);
        date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
        return formatDateKey(date);
      },
      label: (key) => formatLabel(key),
    };
  }

  const first = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 11, 1));
  const keys = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + index, 1));
    return formatDateKey(date);
  });
  return {
    first,
    keys,
    bucketKey: (dateKey) => `${dateKey.slice(0, 7)}-01`,
    label: (key) => new Date(`${key}T00:00:00.000Z`).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }),
  };
};

// @route   GET /api/analytics/sales?period=daily|weekly|monthly
// @desc    Sales revenue by online orders and physical sales
// @access  Private (Admin)
router.get('/analytics/sales', protectAdmin, async (req, res) => {
  try {
    const period = ['daily', 'weekly', 'monthly'].includes(req.query.period)
      ? req.query.period
      : 'daily';
    const { first, keys, bucketKey, label } = getSalesPeriod(period);
    const [onlineResult, physicalResult] = await Promise.all([
      Order.aggregate([
        { $match: { status: { $nin: ['cancelled', 'canceled', 'refunded'] } } },
        {
          $facet: {
            total: [{ $group: { _id: null, amount: { $sum: '$totalAmount' } } }],
            periods: [
              { $match: { createdAt: { $gte: first } } },
              {
                $group: {
                  _id: {
                    $dateToString: {
                      format: '%Y-%m-%d',
                      date: '$createdAt',
                      timezone: 'UTC',
                    },
                  },
                  amount: { $sum: '$totalAmount' },
                },
              },
            ],
          },
        },
      ]),
      PerfumeSale.aggregate([
        {
          $facet: {
            total: [{ $group: { _id: null, amount: { $sum: '$totalSaleAmount' } } }],
            periods: [
              { $match: { saleDate: { $gte: first } } },
              {
                $group: {
                  _id: {
                    $dateToString: {
                      format: '%Y-%m-%d',
                      date: '$saleDate',
                      timezone: 'UTC',
                    },
                  },
                  amount: { $sum: '$totalSaleAmount' },
                },
              },
            ],
          },
        },
      ]),
    ]);

    const sumPeriods = (rows) => rows.reduce((totals, row) => {
      const key = bucketKey(row._id);
      totals[key] = (totals[key] || 0) + row.amount;
      return totals;
    }, {});
    const onlineByPeriod = sumPeriods(onlineResult[0]?.periods || []);
    const physicalByPeriod = sumPeriods(physicalResult[0]?.periods || []);
    const data = keys.map((key) => ({
      date: label(key),
      onlineSales: onlineByPeriod[key] || 0,
      physicalSales: physicalByPeriod[key] || 0,
    }));
    const onlineRevenue = onlineResult[0]?.total[0]?.amount || 0;
    const physicalRevenue = physicalResult[0]?.total[0]?.amount || 0;

    res.status(200).json({
      period,
      data,
      totalRevenue: onlineRevenue + physicalRevenue,
    });
  } catch (error) {
    console.error('Failed to load sales analytics:', error);
    res.status(500).json({ message: 'Failed to load sales analytics' });
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

    const [
      todaySales,
      weekSales,
      monthSales,
      onlineRevenueAgg,
      physicalRevenueAgg,
      todayVisitorIps,
      weekVisitorIps,
      allVisitorIps,
      pageAgg,
    ] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: startOfToday } }),
      Order.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Order.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Order.aggregate([
        { $match: { status: { $nin: ['cancelled', 'canceled', 'refunded'] } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      PerfumeSale.aggregate([
        { $group: { _id: null, total: { $sum: '$totalSaleAmount' } } },
      ]),
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
      totalRevenue: (onlineRevenueAgg[0]?.total || 0) + (physicalRevenueAgg[0]?.total || 0),
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