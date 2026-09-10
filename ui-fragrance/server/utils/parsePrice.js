// Perfume.price is stored as a display string like "Rs. 4,500" (see
// models/Perfume.js). Payment gateways need a precise numeric PKR amount.
//
// We anchor the match to the END of the string and capture a digit run
// (with optional comma thousands-separators) plus an optional decimal
// tail. This avoids a naive "strip everything but digits/periods" approach
// misreading the period in "Rs." itself as a decimal point (e.g. turning
// "Rs. 4,500" into 0.45 instead of 4500).
const parsePkrAmount = (priceString) => {
  if (typeof priceString !== 'string') return NaN;

  const match = priceString.match(/(\d[\d,]*)(\.\d{1,2})?\s*$/);
  if (!match) return NaN;

  const wholePart = match[1].replace(/,/g, '');
  const decimalPart = match[2] || '';
  return parseFloat(wholePart + decimalPart);
};

module.exports = parsePkrAmount;