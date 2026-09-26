const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    perfumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Perfume',
      required: [true, 'Perfume ID is required'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: [true, 'Review text is required'],
      trim: true,
    },
    photos: {
      type: [String],
      default: [],
      validate: {
        validator: function (value) {
          return Array.isArray(value) && value.length <= 3;
        },
        message: 'Maximum 3 photos allowed',
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Review', reviewSchema);
