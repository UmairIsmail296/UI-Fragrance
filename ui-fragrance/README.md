# UI Fragrance — Premium Perfume E-Commerce Website

A full-stack, luxury-themed e-commerce website for a fictional premium
perfume brand, **UI Fragrance**. Built with React (Vite) on the frontend
and Express + MongoDB on the backend.

## Tech Stack

**Frontend:** React.js (Vite), React Router, Axios, React Toastify
**Backend:** Node.js, Express.js, MongoDB, Mongoose
**Auth:** JWT (admin only)
**Uploads:** Multer (images stored in `server/uploads`, served statically)
**Email:** Nodemailer (Gmail SMTP) for order confirmation emails

## Folder Structure

```
ui-fragrance/
├── client/   # React frontend (Vite)
└── server/   # Express backend (API)
```

## Getting Started

### 1. Prerequisites
- Node.js v18+
- MongoDB running locally (or a MongoDB Atlas connection string)
- A Gmail account with an "App Password" for Nodemailer (recommended over
  your real password — enable 2FA on the Gmail account, then generate an
  App Password under Google Account → Security → App Passwords)

### 2. Backend Setup

```bash
cd server
npm install
```

Edit `server/.env` with your own values:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ui-fragrance
JWT_SECRET=uifragrance_secret_key_2025
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

Seed the database with the default admin user and the default perfume
("Velvet Oud Royale"):

```bash
node seed.js
```

Start the backend:

```bash
npm run dev   # uses nodemon
# or
npm start
```

The API will run on `http://localhost:5000`.

### 3. Frontend Setup

In a new terminal:

```bash
cd client
npm install
npm run dev
```

The site will run on `http://localhost:5173`. API requests to `/api` and
`/uploads` are proxied to the backend (see `client/vite.config.js`), so no
extra CORS configuration is needed in development.

### 4. Admin Access

The admin dashboard is intentionally **not linked anywhere in the UI**.
Access it directly by typing the URL:

```
http://localhost:5173/admin/login
```

Default credentials (from the seed script / `.env`):

```
Username: admin
Password: admin123
```

From the dashboard you can:
- Add, edit, and delete perfumes (with image upload)
- View all customer orders
- Update order status (Order Placed → Order Confirmed → Dispatched →
  Out for Delivery → Delivered)

### 5. Order Tracking

Customers can track their order at `/track-order` using the Order ID
(e.g. `UIF-1001`) emailed to them after checkout.

### 6. WhatsApp Contact

A floating WhatsApp icon appears on every public page and opens a chat
with **0309 6248054** via `https://wa.me/923096248054`.

## Notes

- The default perfume image and founder photos use placeholder stock
  images from Unsplash — replace with real assets from the admin
  dashboard (perfumes) or by editing `AboutUs.jsx` (founder photos)
  before going live.
- Order confirmation emails will silently fail (logged to the server
  console) if `EMAIL_USER` / `EMAIL_PASS` are not configured correctly —
  the order itself will still be saved successfully.
- For production, set a strong, unique `JWT_SECRET` and use a hosted
  MongoDB instance (e.g. MongoDB Atlas).

## © 2025 UI Fragrance. All Rights Reserved.
