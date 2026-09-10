const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  ipAddress: { type: String },
  visitedAt: { type: Date, default: Date.now },
  pageVisited: { type: String },
  userAgent: { type: String },
});

// Speeds up the date-range aggregations used by the analytics endpoints
visitorSchema.index({ visitedAt: 1 });

module.exports = mongoose.model('Visitor', visitorSchema);