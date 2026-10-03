const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Perfume = require('../models/Perfume');
const generateTrackingId = require('../utils/generateTrackingId');
const { protectAdmin } = require('../middleware/authMiddleware');
const { sendOrderConfirmationEmail } = require('../utils/sendEmail');
const uploadMiddleware = require('../middleware/uploadMiddleware');
const upload = uploadMiddleware;
const { uploadToCloudinary } = uploadMiddleware;

const PAYMENT_SCREENSHOT_MAX_BYTES = 5 * 1024 * 1024;

const normalizeOrderStatus = (value) => {
  const status = String(value || '').trim().toLowerCase();
  const statuses = {
    pending: 'pending',
    'order placed': 'pending',
    processing: 'processing',
    'order confirmed': 'processing',
    shipped: 'shipped',
    dispatched: 'shipped',
    'out for delivery': 'shipped',
    delivered: 'delivered',
    cancelled: 'cancelled',
    canceled: 'cancelled',
  };
  return statuses[status] || null;
};

const formatOrderStatus = (value) => {
  const status = normalizeOrderStatus(value) || 'pending';
  return status.charAt(0).toUpperCase() + status.slice(1);
};

// @route   POST /api/orders
// @desc    Place a new multi-item order. Accepts an `items` array of
//          { perfumeId, quantity }. unitPrice/perfumeName are NOT trusted
//          from the client — each perfumeId is looked up server-side so a
//          tampered request body can never change what the customer is charged.
// @access  Public
router.post('/', upload.single('paymentScreenshot'), async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerMobile,
      customerCity,
      customerArea,
      items,
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'A payment screenshot is required to place an order' });
    }

    if (req.file.size > PAYMENT_SCREENSHOT_MAX_BYTES) {
      return res.status(413).json({ message: 'Payment screenshots must be 5 MB or smaller.' });
    }

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

    let parsedItems = items;
    if (typeof parsedItems === 'string') {
      try {
        parsedItems = JSON.parse(parsedItems);
      } catch {
        return res.status(400).json({ message: 'Order items are invalid' });
      }
    }

    if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty' });
    }

    const orderItems = [];
    for (const rawItem of parsedItems) {
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

    const paymentScreenshotUrl = await uploadToCloudinary(
      req.file,
      'ui-fragrance/payment-screenshots'
    );
    if (!paymentScreenshotUrl) {
      return res.status(500).json({ message: 'Payment screenshot upload failed' });
    }

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
      paymentScreenshotUrl,
      status: 'pending',
    });

    const emailSent = await sendOrderConfirmationEmail(order);
    if (!emailSent) {
      console.error(`Order ${order.orderId} was created but the confirmation email was not delivered.`);
    }

    res.status(201).json({
      message: emailSent
        ? 'Order placed successfully! A confirmation email has been sent.'
        : 'Order placed successfully. The confirmation email could not be delivered at this time.',
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
    const trackedOrder = order.toObject();
    delete trackedOrder.paymentScreenshotUrl;
    trackedOrder.orderStatus = formatOrderStatus(trackedOrder.status || trackedOrder.orderStatus);
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.status(200).json(trackedOrder);
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
    res.status(200).json(orders.map((order) => {
      const orderData = order.toObject();
      orderData.orderStatus = formatOrderStatus(orderData.status || orderData.orderStatus);
      return orderData;
    }));
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
    const normalizedStatus = normalizeOrderStatus(orderStatus);
    if (!normalizedStatus) {
      return res.status(400).json({ message: 'Invalid order status' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = normalizedStatus;
    await order.save();

    const updatedOrder = order.toObject();
    updatedOrder.orderStatus = formatOrderStatus(updatedOrder.status);
    res.status(200).json(updatedOrder);
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