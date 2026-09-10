const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const emailShell = (bodyHtml) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>UI Fragrance</title>
  </head>
  <body style="margin:0; padding:0; background-color:#0a0a0a; font-family: 'Poppins', Arial, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a; padding: 40px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#1a1a2e; border: 1px solid #d4af37; border-radius: 8px; overflow:hidden;">
            <tr>
              <td style="background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%); padding: 32px; text-align:center; border-bottom: 2px solid #d4af37;">
                <h1 style="color:#d4af37; font-family: Georgia, 'Playfair Display', serif; letter-spacing: 3px; margin:0; font-size: 28px;">UI FRAGRANCE</h1>
                <p style="color:#ffffff; margin: 8px 0 0; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">Your Signature Scent Awaits</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 32px; color:#ffffff;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="background-color:#0a0a0a; padding: 20px 32px; text-align:center; border-top: 1px solid #333;">
                <p style="margin:0; color:#8b8b8b; font-size: 12px;">© 2025 UI Fragrance. All Rights Reserved.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

// REMOVED: the "Payment Details" section (payment method, TRX/reference,
// payment status) has been fully removed per Change 1. The confirmation
// email now covers only: customer name, tracking ID, perfume, quantity,
// unit price, total amount, and order status.
const buildOrderConfirmationHtml = (order) => {
  const { customerName, orderId, items = [], totalAmount, status } = order;

  const itemsRows = (items || [])
    .map(
      (it) => `
        <tr>
          <td style="padding:8px 12px; border-bottom:1px solid #2a2a3a;">${it.perfumeName}</td>
          <td style="padding:8px 12px; border-bottom:1px solid #2a2a3a; text-align:center;">${it.quantity}</td>
          <td style="padding:8px 12px; border-bottom:1px solid #2a2a3a; text-align:right;">Rs. ${Number(it.unitPrice).toLocaleString('en-PK')}</td>
          <td style="padding:8px 12px; border-bottom:1px solid #2a2a3a; text-align:right;">Rs. ${Number(it.subtotal).toLocaleString('en-PK')}</td>
        </tr>`
    )
    .join('\n');

  const body = `
    <h2 style="color:#d4af37; font-family: Georgia, 'Playfair Display', serif; font-size: 20px; margin-top:0;">Thank you for your order, ${customerName}!</h2>
    <p style="color:#e0e0e0; line-height:1.6; font-size: 14px;">
      Your Tracking ID is <strong style="color:#d4af37;">${orderId}</strong>.
      Use this ID to track your order on our website.
    </p>

    <h4 style="color:#8b8b8b; margin-top:18px;">Order Summary</h4>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 12px 0; border-radius: 6px; background-color: #14141f;">
      <thead>
        <tr>
          <th style="text-align:left; padding:8px 12px; color:#bdbdbd; font-size:13px;">Product</th>
          <th style="text-align:center; padding:8px 12px; color:#bdbdbd; font-size:13px;">Qty</th>
          <th style="text-align:right; padding:8px 12px; color:#bdbdbd; font-size:13px;">Unit</th>
          <th style="text-align:right; padding:8px 12px; color:#bdbdbd; font-size:13px;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3" style="padding:12px; text-align:right; color:#ffffff; font-weight:600;">Total</td>
          <td style="padding:12px; text-align:right; color:#d4af37; font-weight:700;">Rs. ${Number(totalAmount).toLocaleString('en-PK')}</td>
        </tr>
      </tfoot>
    </table>

    <p style="color:#e0e0e0; line-height:1.6; font-size: 14px;">We'll keep you updated on every step, from confirmation to delivery.</p>

    <div style="text-align:center; margin: 28px 0;">
      <span style="display:inline-block; background: linear-gradient(135deg, #d4af37 0%, #b8860b 100%); color:#0a0a0a; padding: 12px 28px; border-radius: 4px; font-weight:600; font-size: 13px; letter-spacing: 1px;">
        TRACK YOUR ORDER ON OUR WEBSITE
      </span>
    </div>
  `;

  return emailShell(body);
};

const sendOrderConfirmationEmail = async (order) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"UI Fragrance" <${process.env.EMAIL_USER}>`,
      to: order.customerEmail,
      subject: `Order Confirmation - ${order.orderId} | UI Fragrance`,
      html: buildOrderConfirmationHtml(order),
    });
    return true;
  } catch (error) {
    console.error('--- Failed to send order confirmation email ---');
    console.error('Message:', error.message);
    if (error.code) console.error('Code:', error.code);
    if (error.response) console.error('SMTP response:', error.response);
    console.error('------------------------------------------------');
    return false;
  }
};

// REMOVED: sendPaymentFailedEmail — no longer needed, there is no online
// payment step that can fail.

module.exports = { sendOrderConfirmationEmail };