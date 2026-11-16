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
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Bank Transfer', 'Other'],
      required: true,
    },
    addedBy: {
      type: String,
      enum: ['Umair', 'Ibsham'],
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
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PerfumeSale', perfumeSaleSchema);
