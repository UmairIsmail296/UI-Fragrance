const crypto = require('crypto');
const TrackingId = require('../models/TrackingId');

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

// Generates a random 6-character alphanumeric suffix using crypto.randomBytes
// (uppercase letters + digits only), prefixed as "UIF-XXXXXX".
const generateRawId = () => {
  const bytes = crypto.randomBytes(6);
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += CHARS[bytes[i] % CHARS.length];
  }
  return `UIF-${id}`;
};

// The registry's unique index atomically reserves IDs across order types.
const generateTrackingId = async (OrderModel, PerfumeSaleModel, attempt = 0) => {
  if (attempt > 10) {
    throw new Error('Unable to generate a unique tracking ID after 10 attempts');
  }

  await TrackingId.init();
  const candidate = generateRawId();
  const [existingOrder, existingSale] = await Promise.all([
    OrderModel.findOne({ orderId: { $regex: new RegExp(`^${candidate}$`, 'i') } }).select('_id').lean(),
    PerfumeSaleModel.findOne({ trackingId: { $regex: new RegExp(`^${candidate}$`, 'i') } }).select('_id').lean(),
  ]);

  if (existingOrder || existingSale) {
    return generateTrackingId(OrderModel, PerfumeSaleModel, attempt + 1);
  }

  try {
    await TrackingId.create({ trackingId: candidate });
    return candidate;
  } catch (error) {
    if (error.code === 11000) {
      return generateTrackingId(OrderModel, PerfumeSaleModel, attempt + 1);
    }
    throw error;
  }
};

module.exports = generateTrackingId;