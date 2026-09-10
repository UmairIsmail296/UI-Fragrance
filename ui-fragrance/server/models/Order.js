const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  perfumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Perfume' },
  perfumeName: { type: String, required: true },
  unitPrice: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  subtotal: { type: Number, required: true, min: 0 },
});

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    items: {
      type: [OrderItemSchema],
      required: [true, 'At least one order item is required'],
      validate: [(v) => Array.isArray(v) && v.length > 0, 'At least one item is required'],
    },
    customerName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    customerEmail: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    customerMobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
      match: [/^[0-9]+$/, 'Mobile number must contain only digits'],
    },
    customerCity: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    customerArea: {
      type: String,
      required: [true, 'Area/Street address is required'],
      trim: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);