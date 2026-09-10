const crypto = require('crypto');

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

// Generates a tracking ID and guarantees uniqueness against the Order
// collection by regenerating on collision. `OrderModel` is passed in
// (rather than required here) to avoid a circular require with models/Order.js.
const generateTrackingId = async (OrderModel, attempt = 0) => {
  if (attempt > 10) {
    // Astronomically unlikely with 36^6 (~2.2 billion) combinations, but
    // fail loudly rather than looping forever if something is very wrong.
    throw new Error('Unable to generate a unique tracking ID after 10 attempts');
  }

  const candidate = generateRawId();
  const existing = await OrderModel.findOne({ orderId: candidate });

  if (existing) {
    return generateTrackingId(OrderModel, attempt + 1);
  }

  return candidate;
};

module.exports = generateTrackingId;