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

  throw new Error(
    'Missing email configuration. Set SMTP_HOST/SMTP_USER/SMTP_PASSWORD or EMAIL_USER/EMAIL_PASS in your environment.'
  );
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

// Escape dynamic values before inserting them into the HTML email.
const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (character) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };

    return entities[character];
  });

const formatAmount = (value) => Number(value).toLocaleString('en-PK');

// Shared email wrapper
const emailShell = (bodyHtml) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>UI Fragrance — Order Confirmation</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        background-color: #f3f8f4;
        font-family: Arial, Helvetica, sans-serif;
        -webkit-font-smoothing: antialiased;
      }

      table {
        border-collapse: collapse;
      }

      @media only screen and (max-width: 620px) {
        .email-container {
          width: 100% !important;
        }

        .content-cell {
          padding: 26px 18px !important;
        }

        .tracking-code {
          font-size: 18px !important;
        }

        .item-cell {
          padding: 10px 5px !important;
          font-size: 12px !important;
        }
      }
    </style>
  </head>

  <body style="margin:0; padding:0; background-color:#f3f8f4;">
    <table
      role="presentation"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      style="background-color:#f3f8f4;"
    >
      <tr>
        <td align="center" style="padding:40px 10px;">
          <table
            role="presentation"
            class="email-container"
            width="600"
            cellpadding="0"
            cellspacing="0"
            style="width:600px; max-width:600px; background-color:#ffffff; border:1px solid #dce9df; border-radius:12px;"
          >
            <!-- Header -->
            <tr>
              <td
                align="center"
                style="padding:36px 20px 30px; background-color:#ffffff; border-bottom:1px solid #e5efe7;"
              >
                <p style="margin:0 0 10px; color:#668471; font-size:10px; font-weight:bold; letter-spacing:3px; text-transform:uppercase;">
                  ORDER CONFIRMATION
                </p>

                <h1 style="margin:0; color:#163c2b; font-family:Georgia, serif; font-size:26px; font-weight:normal; letter-spacing:2px;">
                  UI <span style="color:#38805a;">FRAGRANCE</span>
                </h1>
              </td>
            </tr>

            <!-- Email content -->
            <tr>
              <td
                class="content-cell"
                style="padding:36px 32px; color:#294b38;"
              >
                ${bodyHtml}
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td
                align="center"
                style="padding:24px 20px; background-color:#f8fbf8; border-top:1px solid #e5efe7;"
              >
                <p style="margin:0 0 7px; color:#174b35; font-family:Georgia, serif; font-size:15px;">
                  UI Fragrance
                </p>

                <p style="margin:0; color:#819188; font-size:11px; line-height:1.5;">
                  &copy; ${new Date().getFullYear()} UI Fragrance. All rights reserved.
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

// Order confirmation email
const buildOrderConfirmationHtml = (order) => {
  const { customerName, orderId, items = [], totalAmount } = order;

  const safeName = escapeHtml(customerName);
  const safeOrderId = escapeHtml(orderId);
  const whatsappMessage = encodeURIComponent(
    `Hi UI Fragrance, I have an inquiry regarding Order ID: ${orderId ?? ''}`
  );

  const itemsRows = (items || [])
    .map(
      (item) => `
        <tr>
          <td class="item-cell" style="padding:12px 10px; border-bottom:1px solid #e5efe7; color:#163c2b; font-size:13px;">
            ${escapeHtml(item.perfumeName)}
          </td>

          <td class="item-cell" style="padding:12px 10px; border-bottom:1px solid #e5efe7; text-align:center; color:#60766a; font-size:13px;">
            ${escapeHtml(item.quantity)}
          </td>

          <td class="item-cell" style="padding:12px 10px; border-bottom:1px solid #e5efe7; text-align:right; color:#60766a; font-size:13px;">
            Rs. ${formatAmount(item.unitPrice)}
          </td>

          <td class="item-cell" style="padding:12px 10px; border-bottom:1px solid #e5efe7; text-align:right; color:#174b35; font-size:13px; font-weight:bold;">
            Rs. ${formatAmount(item.subtotal)}
          </td>
        </tr>
      `
    )
    .join('\n');

  const body = `
    <!-- Greeting -->
    <h2 style="margin:0 0 12px; color:#163c2b; font-family:Georgia, serif; font-size:23px; font-weight:normal; line-height:1.35;">
      Thank you for your order, ${safeName}!
    </h2>

    <p style="margin:0 0 26px; color:#6d7f72; font-size:14px; line-height:1.7;">
      We have received your order. You can use the tracking ID below to check its status.
    </p>

    <!-- Tracking ID -->
    <table
      role="presentation"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      style="margin-bottom:30px; background-color:#f3f8f4; border:1px solid #dce9df; border-radius:8px;"
    >
      <tr>
        <td align="center" style="padding:20px;">
          <p style="margin:0 0 8px; color:#6d7f72; font-size:10px; font-weight:bold; letter-spacing:2px; text-transform:uppercase;">
            Your tracking ID
          </p>

          <p class="tracking-code" style="margin:0; color:#174b35; font-size:21px; font-weight:bold; letter-spacing:2px;">
            ${safeOrderId}
          </p>
        </td>
      </tr>
    </table>

    <!-- Order summary -->
    <h3 style="margin:0 0 14px; color:#163c2b; font-family:Georgia, serif; font-size:18px; font-weight:normal;">
      Order summary
    </h3>

    <table
      width="100%"
      cellpadding="0"
      cellspacing="0"
      style="margin-bottom:24px; border:1px solid #e5efe7;"
    >
      <thead>
        <tr style="background-color:#f3f8f4;">
          <th class="item-cell" scope="col" style="padding:11px 10px; text-align:left; color:#60766a; font-size:10px; letter-spacing:0.5px; text-transform:uppercase;">
            Fragrance
          </th>

          <th class="item-cell" scope="col" style="padding:11px 10px; text-align:center; color:#60766a; font-size:10px; letter-spacing:0.5px; text-transform:uppercase;">
            Qty
          </th>

          <th class="item-cell" scope="col" style="padding:11px 10px; text-align:right; color:#60766a; font-size:10px; letter-spacing:0.5px; text-transform:uppercase;">
            Price
          </th>

          <th class="item-cell" scope="col" style="padding:11px 10px; text-align:right; color:#60766a; font-size:10px; letter-spacing:0.5px; text-transform:uppercase;">
            Subtotal
          </th>
        </tr>
      </thead>

      <tbody>
        ${itemsRows}
      </tbody>

      <tfoot>
        <tr>
          <td colspan="3" style="padding:15px 10px; text-align:right; color:#163c2b; font-size:14px; font-weight:bold;">
            Total amount
          </td>

          <td style="padding:15px 10px; text-align:right; color:#174b35; font-size:15px; font-weight:bold;">
            Rs. ${formatAmount(totalAmount)}
          </td>
        </tr>
      </tfoot>
    </table>

    <!-- Tracking button -->
    <table
      role="presentation"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      style="margin:28px 0;"
    >
      <tr>
        <td align="center">
          <a
            href="https://www.ui-fragrance.store/track-order"
            target="_blank"
            rel="noopener noreferrer"
            style="display:inline-block; padding:14px 30px; background-color:#174b35; border-radius:6px; color:#ffffff; font-size:12px; font-weight:bold; letter-spacing:1px; text-decoration:none; text-transform:uppercase;"
          >
            Track your order
          </a>
        </td>
      </tr>
    </table>

    <!-- Help -->
    <table
      role="presentation"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      style="border-top:1px solid #e5efe7;"
    >
      <tr>
        <td align="center" style="padding-top:20px; color:#6d7f72; font-size:12px; line-height:1.7;">
          Have a question about your order?<br />

          <a
            href="https://wa.me/923096248054?text=${whatsappMessage}"
            target="_blank"
            rel="noopener noreferrer"
            style="color:#174b35; font-weight:bold; text-decoration:underline;"
          >
            Contact us on WhatsApp: +92 309 6248054
          </a>
        </td>
      </tr>
    </table>
  `;

  return emailShell(body);
};

const buildPhysicalSaleConfirmationHtml = (sale) => {
  const safeName = escapeHtml(sale.customerName || 'Valued Customer');
  const safeTrackingId = escapeHtml(sale.trackingId);
  const safePerfumeName = escapeHtml(sale.perfumeName);
  const safeQuantity = escapeHtml(sale.quantity);
  const orderDate = new Date(sale.saleDate).toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const safeOrderDate = escapeHtml(orderDate);
  const trackingUrl = 'https://www.ui-fragrance.store/track-order';

  return emailShell(`
    <h2 style="margin:0 0 12px; color:#163c2b; font-family:Georgia, serif; font-size:23px; font-weight:normal; line-height:1.35;">
      Thank you, ${safeName}!
    </h2>
    <p style="margin:0 0 26px; color:#6d7f72; font-size:14px; line-height:1.7;">
      Your perfume sale has been confirmed. Use your tracking ID below to view its status.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px; background-color:#f3f8f4; border:1px solid #dce9df; border-radius:8px;">
      <tr>
        <td align="center" style="padding:20px;">
          <p style="margin:0 0 8px; color:#6d7f72; font-size:10px; font-weight:bold; letter-spacing:2px; text-transform:uppercase;">Your tracking ID</p>
          <p class="tracking-code" style="margin:0; color:#174b35; font-size:21px; font-weight:bold; letter-spacing:2px;">${safeTrackingId}</p>
        </td>
      </tr>
    </table>
    <h3 style="margin:0 0 14px; color:#163c2b; font-family:Georgia, serif; font-size:18px; font-weight:normal;">Order details</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px; border:1px solid #e5efe7;">
      <tbody>
        <tr><th scope="row" style="padding:12px 10px; text-align:left; color:#60766a; font-size:13px;">Customer name</th><td style="padding:12px 10px; text-align:right; color:#163c2b; font-size:13px;">${safeName}</td></tr>
        <tr><th scope="row" style="padding:12px 10px; text-align:left; color:#60766a; font-size:13px;">Perfume</th><td style="padding:12px 10px; text-align:right; color:#163c2b; font-size:13px;">${safePerfumeName}</td></tr>
        <tr><th scope="row" style="padding:12px 10px; text-align:left; color:#60766a; font-size:13px;">Quantity</th><td style="padding:12px 10px; text-align:right; color:#163c2b; font-size:13px;">${safeQuantity}</td></tr>
        <tr><th scope="row" style="padding:12px 10px; text-align:left; color:#60766a; font-size:13px;">Order date</th><td style="padding:12px 10px; text-align:right; color:#163c2b; font-size:13px;">${safeOrderDate}</td></tr>
      </tbody>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
      <tr><td align="center">
        <a href="${trackingUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block; padding:14px 30px; background-color:#174b35; border-radius:6px; color:#ffffff; font-size:12px; font-weight:bold; letter-spacing:1px; text-decoration:none; text-transform:uppercase;">Track your order</a>
        <p style="margin:12px 0 0; color:#6d7f72; font-size:12px;"><a href="${trackingUrl}" style="color:#174b35;">${trackingUrl}</a></p>
      </td></tr>
    </table>
  `);
};

// Send order confirmation
const sendOrderConfirmationEmail = async (order) => {
  const fromEmail =
    process.env.FROM_EMAIL || process.env.EMAIL_USER || process.env.SMTP_USER;

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

const sendPhysicalSaleConfirmationEmail = async (sale) => {
  const fromEmail =
    process.env.FROM_EMAIL || process.env.EMAIL_USER || process.env.SMTP_USER;

  try {
    const transporter = createTransporter();

    await transporter.sendMail({
      from: `"UI Fragrance" <${fromEmail}>`,
      to: sale.customerEmail,
      subject: `Sale Confirmed: ${sale.trackingId} | UI Fragrance`,
      html: buildPhysicalSaleConfirmationHtml(sale),
    });

    return true;
  } catch (error) {
    console.error('--- Failed to send physical sale confirmation email ---');
    console.error('Message:', error.message);
    if (error.code) console.error('Code:', error.code);
    if (error.response) console.error('SMTP response:', error.response);
    console.error('--------------------------------------------------------');
    return false;
  }
};

module.exports = { sendOrderConfirmationEmail, sendPhysicalSaleConfirmationEmail };