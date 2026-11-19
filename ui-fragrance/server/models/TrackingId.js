const mongoose = require('mongoose');

const trackingIdSchema = new mongoose.Schema({
  trackingId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
});

module.exports = mongoose.model('TrackingId', trackingIdSchema);
