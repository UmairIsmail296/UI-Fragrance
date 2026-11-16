const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const PerfumeSale = require('../models/PerfumeSale');
const Perfume = require('../models/Perfume');
const { protectAdmin } = require('../middleware/authMiddleware');

const roundMoney = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

const parseSaleInput = async (body) => {
  const perfumeName = typeof body.perfumeName === 'string' ? body.perfumeName.trim() : '';
  const quantity = Number(body.quantity);
  const purchasePrice = Number(body.purchasePrice);
  const sellingPrice = Number(body.sellingPrice);
  const saleDateValue = typeof body.saleDate === 'string' ? body.saleDate : '';
  const saleDate = /^\d{4}-\d{2}-\d{2}$/.test(saleDateValue)
    ? new Date(`${saleDateValue}T00:00:00.000Z`)
    : new Date(NaN);

  if (!perfumeName) {
    return { error: 'Perfume name is required' };
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    return { error: 'Quantity must be a positive whole number' };
  }
  if (
    !Number.isFinite(purchasePrice) ||
    purchasePrice < 0 ||
    !Number.isFinite(sellingPrice) ||
    sellingPrice < 0
  ) {
    return { error: 'Purchase and selling prices must be valid non-negative numbers' };
  }
  if (
    !Number.isFinite(saleDate.getTime()) ||
    saleDate.toISOString().slice(0, 10) !== saleDateValue
  ) {
    return { error: 'Sale date is invalid' };
  }

  let perfumeId = null;
  let normalizedName = perfumeName;
  if (body.perfumeId) {
    if (!mongoose.isValidObjectId(body.perfumeId)) {
      return { error: 'Selected perfume is invalid' };
    }
    const perfume = await Perfume.findById(body.perfumeId).select('name').lean();
    if (!perfume) {
      return { error: 'Selected perfume could not be found' };
    }
    perfumeId = perfume._id;
    normalizedName = perfume.name;
  }

  const normalizedPurchasePrice = roundMoney(purchasePrice);
  const normalizedSellingPrice = roundMoney(sellingPrice);
  const totalSaleAmount = roundMoney(normalizedSellingPrice * quantity);
  const totalCost = roundMoney(normalizedPurchasePrice * quantity);

  return {
    value: {
      perfumeId,
      perfumeName: normalizedName,
      quantity,
      purchasePrice: normalizedPurchasePrice,
      sellingPrice: normalizedSellingPrice,
      totalSaleAmount,
      totalCost,
      profit: roundMoney(totalSaleAmount - totalCost),
      saleDate,
      customerName: typeof body.customerName === 'string' ? body.customerName.trim() : '',
      notes: typeof body.notes === 'string' ? body.notes.trim() : '',
    },
  };
};

const dateBoundary = (value, endOfDay = false) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
};

router.use(protectAdmin);

router.get('/', async (req, res) => {
  try {
    const filter = {};
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const from = typeof req.query.from === 'string' ? dateBoundary(req.query.from) : null;
    const to = typeof req.query.to === 'string' ? dateBoundary(req.query.to, true) : null;

    if ((req.query.from && !from) || (req.query.to && !to)) {
      return res.status(400).json({ message: 'Date filters must use YYYY-MM-DD format' });
    }
    if (from && to && from > to) {
      return res.status(400).json({ message: 'Start date must be on or before end date' });
    }
    if (from || to) {
      filter.saleDate = {};
      if (from) filter.saleDate.$gte = from;
      if (to) filter.saleDate.$lte = to;
    }
    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.perfumeName = { $regex: escapedSearch, $options: 'i' };
    }

    const sales = await PerfumeSale.find(filter).sort({ saleDate: -1, createdAt: -1 }).lean();
    const summary = sales.reduce(
      (totals, sale) => {
        totals.totalSales += 1;
        totals.totalPerfumesSold += sale.quantity;
        totals.totalRevenue = roundMoney(totals.totalRevenue + sale.totalSaleAmount);
        totals.totalProfit = roundMoney(totals.totalProfit + sale.profit);
        return totals;
      },
      { totalSales: 0, totalPerfumesSold: 0, totalRevenue: 0, totalProfit: 0 }
    );

    res.status(200).json({ sales, summary });
  } catch (error) {
    console.error('Failed to fetch perfume sales:', error);
    res.status(500).json({ message: 'Server error while fetching perfume sales' });
  }
});

router.post('/', async (req, res) => {
  try {
    const parsed = await parseSaleInput(req.body);
    if (parsed.error) return res.status(400).json({ message: parsed.error });

    const sale = await PerfumeSale.create(parsed.value);
    res.status(201).json(sale);
  } catch (error) {
    console.error('Failed to create perfume sale:', error);
    res.status(500).json({ message: 'Server error while creating perfume sale' });
  }
});

router.put('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Sale ID is invalid' });
  }

  try {
    const parsed = await parseSaleInput(req.body);
    if (parsed.error) return res.status(400).json({ message: parsed.error });

    const sale = await PerfumeSale.findByIdAndUpdate(req.params.id, parsed.value, {
      new: true,
      runValidators: true,
    });
    if (!sale) return res.status(404).json({ message: 'Sale not found' });
    res.status(200).json(sale);
  } catch (error) {
    console.error('Failed to update perfume sale:', error);
    res.status(500).json({ message: 'Server error while updating perfume sale' });
  }
});

router.delete('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Sale ID is invalid' });
  }

  try {
    const sale = await PerfumeSale.findByIdAndDelete(req.params.id);
    if (!sale) return res.status(404).json({ message: 'Sale not found' });
    res.status(200).json({ message: 'Sale deleted successfully' });
  } catch (error) {
    console.error('Failed to delete perfume sale:', error);
    res.status(500).json({ message: 'Server error while deleting perfume sale' });
  }
});

module.exports = router;
