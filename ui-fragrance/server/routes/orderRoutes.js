const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Perfume = require('../models/Perfume');
const generateTrackingId = require('../utils/generateTrackingId');
const { protectAdmin } = require('../middleware/authMiddleware');
const { sendOrderConfirmationEmail } = require('../utils/sendEmail');

// @route   POST /api/orders
// @desc    Place a new multi-item order. Accepts an `items` array of
//          { perfumeId, quantity }. unitPrice/perfumeName are NOT trusted
//          from the client — each perfumeId is looked up server-side so a
//          tampered request body can never change what the customer is charged.
// @access  Public
router.post('/', async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerMobile,
      customerCity,
      customerArea,
      items,
    } = req.body;

    if (!customerName || !customerEmail || !customerMobile || !customerCity || !customerArea) {
      return res.status(400).json({ message: 'All customer details are required' });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(customerEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    const mobileRegex = /^[0-9]+$/;
    if (!mobileRegex.test(customerMobile)) {
      return res.status(400).json({ message: 'Mobile number must contain only digits' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty' });
    }

    const orderItems = [];
    for (const rawItem of items) {
      const { perfumeId, quantity } = rawItem;

      const parsedQuantity = parseInt(quantity, 10);
      if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1 || parsedQuantity > 10) {
        return res.status(400).json({ message: 'Each item quantity must be between 1 and 10' });
      }

      const perfume = await Perfume.findById(perfumeId);
      if (!perfume) {
        return res.status(400).json({ message: 'One of the items in your cart could not be found' });
      }

      // FIXED: no more string parsing here — discountPrice is a real
      // Number on the Perfume model now, so it's used directly. This is
      // what actually eliminates the price-corruption bug at its root for
      // every future order, rather than defensively re-parsing a string.
      const unitPrice = perfume.discountPrice;

      if (!unitPrice || unitPrice <= 0) {
        return res.status(500).json({ message: `Could not determine a valid price for ${perfume.name}` });
      }

      orderItems.push({
        perfumeId: perfume._id,
        perfumeName: perfume.name,
        unitPrice,
        quantity: parsedQuantity,
        subtotal: unitPrice * parsedQuantity,
      });
    }

    const totalAmount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

    const orderId = await generateTrackingId(Order);

    const order = await Order.create({
      orderId,
      customerName,
      customerEmail,
      customerMobile,
      customerCity,
      customerArea,
      items: orderItems,
      totalAmount,
      orderStatus: 'Order Placed',
    });

    await sendOrderConfirmationEmail(order);

    res.status(201).json({
      message: 'Order placed successfully! A confirmation email has been sent.',
      order,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error while placing order', error: error.message });
  }
});

// @route   GET /api/orders/track/:orderId
// @desc    Track an order by Tracking ID (case-insensitive)
// @access  Public
router.get('/track/:orderId', async (req, res) => {
  try {
    const rawId = req.params.orderId.trim();
    const escaped = rawId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const order = await Order.findOne({
      orderId: { $regex: new RegExp(`^${escaped}$`, 'i') },
    });

    if (!order) {
      return res.status(404).json({ message: 'No order found with this Tracking ID' });
    }
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error while tracking order', error: error.message });
  }
});

// @route   GET /api/orders
// @desc    Get all orders
// @access  Private (Admin)
router.get('/', protectAdmin, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching orders', error: error.message });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order fulfillment status (Dispatched, Delivered, etc.)
// @access  Private (Admin)
router.put('/:id/status', protectAdmin, async (req, res) => {
  try {
    const { orderStatus } = req.body;
    const validStatuses = [
      'Order Placed',
      'Order Confirmed',
      'Dispatched',
      'Out for Delivery',
      'Delivered',
    ];

    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.orderStatus = orderStatus;
    await order.save();

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error while updating order status', error: error.message });
  }
});

// @route   DELETE /api/orders/:id
// @desc    Permanently delete an order
// @access  Private (Admin)
router.delete('/:id', protectAdmin, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error while deleting order', error: error.message });
  }
});

module.exports = router;