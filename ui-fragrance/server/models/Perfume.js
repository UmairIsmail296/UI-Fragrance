const mongoose = require('mongoose');

const perfumeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Perfume name is required'],
      trim: true,
    },
    brand: {
      type: String,
      required: [true, 'Brand is required'],
      trim: true,
    },
    // FIXED: replaced the old single `price` display-string field with two
    // real Number fields. This is the actual root-cause fix for the
    // "4500 shows as 0.45" bug — that bug came from regex-parsing a string
    // like "Rs. 4,500" back into a number on the client; storing real
    // numbers end-to-end (here → cart → order) removes that parsing step
    // entirely rather than patching it again.
    actualPrice: {
      type: Number,
      required: [true, 'Actual price is required'],
      min: 0,
    },
    discountPrice: {
      type: Number,
      required: [true, 'Discount price is required'],
      min: 0,
    },
    size: {
      type: String,
      required: [true, 'Size is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    topNotes: {
      type: String,
      required: [true, 'Top notes are required'],
    },
    middleNotes: {
      type: String,
      required: [true, 'Middle notes are required'],
    },
    baseNotes: {
      type: String,
      required: [true, 'Base notes are required'],
    },
    photos: {
      type: [String],
      required: true,
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length >= 1 && v.length <= 5;
        },
        message: 'Must have between 1 and 5 photos',
      },
    },
    videos: {
      type: [String],
      default: [],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length <= 2;
        },
        message: 'Maximum 2 videos allowed',
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Perfume', perfumeSchema);