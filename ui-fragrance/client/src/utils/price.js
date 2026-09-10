// FIXED: shared, defensive price utilities used consistently by
// CartContext, CartPage, and CheckoutPage — one implementation instead of
// three near-duplicates, and every read-site re-coerces the value instead
// of blindly trusting whatever is already stored (including old
// localStorage entries saved before this fix, or a perfume price that
// isn't in the usual "Rs. 4,500" format).

// Safely coerces ANY price value (a proper number, a numeric string like
// "4500", or a display string like "Rs. 4,500") into a clean number.
// Returns 0 for anything unparseable rather than NaN, so a bad value can
// never silently corrupt a sum.
export const toNumericPrice = (value) => {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value;
  }

  if (typeof value !== 'string') return 0;

  // Anchored to the END of the string so a stray period in a currency
  // prefix (e.g. the "." in "Rs.") is never misread as a decimal point.
  const match = value.match(/(\d[\d,]*)(\.\d{1,2})?\s*$/);
  if (!match) return 0;

  const wholePart = match[1].replace(/,/g, '');
  const decimalPart = match[2] || '';
  const parsed = parseFloat(wholePart + decimalPart);
  return Number.isNaN(parsed) ? 0 : parsed;
};

// Consistent "Rs. 4,500" display formatting used everywhere a price is shown.
export const formatPrice = (amount) => `Rs. ${Number(amount || 0).toLocaleString('en-PK')}`;