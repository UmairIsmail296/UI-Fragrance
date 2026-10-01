const nodemailer = require('nodemailer');

const getEmailConfig = () => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const smtpPassword = process.env.SMTP_PASSWORD || process.env.EMAIL_PASS;

  if (smtpHost && smtpUser && smtpPassword) {
    return {
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
      tls: {
        rejectUnauthorized: false,
      },
    };
  }

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return {
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    };
  }

  throw new Error('Missing email configuration. Set SMTP_HOST/SMTP_USER/SMTP_PASSWORD or EMAIL_USER/EMAIL_PASS in your environment.');
};

const createTransporter = () => {
  const config = getEmailConfig();
  const transporter = nodemailer.createTransport(config);

  transporter.verify((error) => {
    if (error) {
      console.error('Email transporter verification failed:', error.message);
      return;
    }
    console.log('Email transporter is ready for dispatch');
  });

  return transporter;
};

// --- LUXURY EMAIL WRAPPER (SHELL) ---
const emailShell = (bodyHtml) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>UI Fragrance — Order Confirmation</title>
    <style>
      body { margin: 0; padding: 0; background-color: #060606; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
      table { border-collapse: collapse; }
      @media only screen and (max-width: 620px) {
        .email-container { width: 100% !important; }
        .content-cell { padding: 24px 16px !important; }
        .voucher-code { font-size: 18px !important; }
      }
    </style>
  </head>
  <body style="margin:0; padding:0; background-color:#060606;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#060606; padding: 40px 10px;">
      <tr>
        <td align="center">
          
          <!-- MAIN CARD -->
          <table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0" style="background-color:#111111; border: 1px solid rgba(212, 175, 55, 0.25); border-radius: 12px; overflow:hidden; box-shadow: 0 15px 40px rgba(0,0,0,0.8);">
            
            <!-- HEADER -->
            <tr>
              <td style="background: linear-gradient(180deg, #181818 0%, #0d0d0d 100%); padding: 36px 20px 28px; text-align:center; border-bottom: 1px solid rgba(212, 175, 55, 0.2);">
                <span style="display:inline-block; font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #d4af37; margin-bottom: 6px;">Haute Parfumerie</span>
                <h1 style="color:#ffffff; font-family: Georgia, 'Playfair Display', serif; letter-spacing: 4px; margin:0; font-size: 26px; font-weight: normal;">
                  UI <span style="color:#d4af37; font-style: italic;">FRAGRANCE</span>
                </h1>
              </td>
            </tr>

            <!-- BODY INJECTION -->
            <tr>
              <td class="content-cell" style="padding: 36px 32px; color:#e0e0e0;">
                ${bodyHtml}
              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td style="background-color:#090909; padding: 24px 30px; text-align:center; border-top: 1px solid #1f1f1f;">
                <p style="margin:0 0 6px; color:#d4af37; font-size: 11px; letter-spacing: 2px; text-transform: uppercase;">
                  Artisanal Luxury Perfumes
                </p>
                <p style="margin:0; color:#666666; font-size: 11px;">
                  &copy; ${new Date().getFullYear()} UI Fragrance. All Rights Reserved.
                </p>
              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>
  </body>
</html>
`;

// --- ORDER CONFIRMATION EMAIL TEMPLATE ---
const buildOrderConfirmationHtml = (order) => {
  const { customerName, orderId, items = [], totalAmount } = order;

  const itemsRows = (items || [])
    .map(
      (it) => `
        <tr>
          <td style="padding: 12px 10px; border-bottom: 1px solid #222222; color: #ffffff; font-size: 13px; font-weight: 500;">
            ${it.perfumeName}
          </td>
          <td style="padding: 12px 10px; border-bottom: 1px solid #222222; text-align: center; color: #aaaaaa; font-size: 13px;">
            ${it.quantity}
          </td>
          <td style="padding: 12px 10px; border-bottom: 1px solid #222222; text-align: right; color: #aaaaaa; font-size: 13px;">
            Rs. ${Number(it.unitPrice).toLocaleString('en-PK')}
          </td>
          <td style="padding: 12px 10px; border-bottom: 1px solid #222222; text-align: right; color: #d4af37; font-size: 13px; font-weight: 600;">
            Rs. ${Number(it.subtotal).toLocaleString('en-PK')}
          </td>
        </tr>`
    )
    .join('\n');

  const body = `
    <!-- GREETING -->
    <h2 style="color:#ffffff; font-family: Georgia, 'Playfair Display', serif; font-size: 21px; margin: 0 0 10px; font-weight: normal;">
      Thank you for your order, <span style="color:#d4af37;">${customerName}</span>!
    </h2>
    <p style="color:#9e9e9e; line-height: 1.6; font-size: 14px; margin: 0 0 24px;">
      We are delighted to confirm that your order has been received and is currently being prepared by our perfume artisans.
    </p>

    <!-- TRACKING CODE VOUCHER -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#161616; border: 1px dashed #d4af37; border-radius: 8px; margin-bottom: 28px;">
      <tr>
        <td style="padding: 16px 20px; text-align: center;">
          <span style="display:block; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #888888; margin-bottom: 4px;">
            Your Unique Tracking ID
          </span>
          <span class="voucher-code" style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 20px; font-weight: 700; letter-spacing: 3px; color: #d4af37;">
            ${orderId}
          </span>
        </td>
      </tr>
    </table>

    <!-- ORDER SUMMARY TITLE -->
    <h3 style="color:#d4af37; font-family: Georgia, 'Playfair Display', serif; font-size: 15px; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 12px; font-weight: normal;">
      Receipt Summary
    </h3>

    <!-- ITEMS TABLE -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0c0c0c; border: 1px solid #222222; border-radius: 8px; margin-bottom: 24px;">
      <thead>
        <tr style="background-color: #171717;">
          <th style="text-align: left; padding: 10px; color: #888888; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Fragrance</th>
          <th style="text-align: center; padding: 10px; color: #888888; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Qty</th>
          <th style="text-align: right; padding: 10px; color: #888888; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Price</th>
          <th style="text-align: right; padding: 10px; color: #888888; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3" style="padding: 14px 10px; text-align: right; color: #ffffff; font-size: 14px; font-weight: 600;">
            Total Amount (COD):
          </td>
          <td style="padding: 14px 10px; text-align: right; color: #d4af37; font-size: 16px; font-weight: 700;">
            Rs. ${Number(totalAmount).toLocaleString('en-PK')}
          </td>
        </tr>
      </tfoot>
    </table>

    <!-- CTA BUTTON -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 28px 0 24px;">
      <tr>
        <td align="center">
          <a href="https://www.ui-fragrance.store/track-order" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: linear-gradient(135deg, #e6c86e 0%, #b8932b 100%); color: #080808; padding: 14px 32px; border-radius: 30px; font-weight: 600; font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; text-decoration: none; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);">
            Track Your Order Live
          </a>
        </td>
      </tr>
    </table>

    <!-- CONCIERGE HELP STRIP -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top: 1px solid #222222; padding-top: 18px;">
      <tr>
        <td style="text-align: center; color: #777777; font-size: 12px; line-height: 1.6;">
          Need to make changes to your delivery address? <br />
          <a href="https://wa.me/923096248054?text=Hi%20UI%20Fragrance,%20I%20have%20an%20inquiry%20regarding%20Order%20ID:%20${orderId}" target="_blank" rel="noopener noreferrer" style="color: #d4af37; text-decoration: underline; font-weight: 500;">
            Chat with Concierge on WhatsApp (+92 309 6248054) &rarr;
          </a>
        </td>
      </tr>
    </table>
  `;

  return emailShell(body);
};

// --- DISPATCH FUNCTION ---
const sendOrderConfirmationEmail = async (order) => {
  const fromEmail = process.env.FROM_EMAIL || process.env.EMAIL_USER || process.env.SMTP_USER;

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"UI Fragrance" <${fromEmail}>`,
      to: order.customerEmail,
      subject: `Order Confirmed: ${order.orderId} | UI Fragrance`,
      html: buildOrderConfirmationHtml(order),
    });
    return true;
  } catch (error) {
    console.error('--- Failed to send order confirmation email ---');
    console.error('Message:', error.message);
    if (error.code) console.error('Code:', error.code);
    if (error.response) console.error('SMTP response:', error.response);
    if (error.stack) console.error('Stack:', error.stack);
    console.error('------------------------------------------------');
    return false;
  }
};

module.exports = { sendOrderConfirmationEmail };