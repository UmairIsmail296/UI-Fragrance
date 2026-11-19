const mongoose = require('mongoose');

const perfumeSaleSchema = new mongoose.Schema(
  {
    perfumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Perfume',
      default: null,
    },
    perfumeName: {
      type: String,
      required: [true, 'Perfume name is required'],
      trim: true,
    },
    trackingId: {
      type: String,
      trim: true,
      uppercase: true,
      unique: true,
      sparse: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: Number.isInteger,
    },
    purchasePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    sellingPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['Paid', 'Pending'],
      required: true,
    },
    addedBy: {
      type: String,
      enum: ['Ibsham Fayyaz', 'Umair'],
      required: true,
    },
    totalSaleAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    totalCost: {
      type: Number,
      required: true,
      min: 0,
    },
    profit: {
      type: Number,
      required: true,
    },
    saleDate: {
      type: Date,
      required: true,
    },
    customerName: {
      type: String,
      trim: true,
      default: '',
    },
    customerEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
      match: [/^$|^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    customerPhone: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PerfumeSale', perfumeSaleSchema);
