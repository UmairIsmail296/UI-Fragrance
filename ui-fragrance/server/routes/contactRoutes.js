const express = require('express');
const ContactInquiry = require('../models/ContactInquiry');
const { protectAdmin } = require('../middleware/authMiddleware');

const router = express.Router();
const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
const PHONE_PATTERN = /^\+?[\d\s().-]+$/;
const MAX_MESSAGE_LENGTH = 5000;

router.post('/', async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  const phoneDigits = phone.replace(/\D/g, '');

  if (!name) return res.status(400).json({ message: 'Please enter your name.' });
  if (name.length > 120) {
    return res.status(400).json({ message: 'Your name must be 120 characters or fewer.' });
  }
  if (!phone) return res.status(400).json({ message: 'Please enter your phone number.' });
  if (phone.length > 30) {
    return res.status(400).json({ message: 'Your phone number must be 30 characters or fewer.' });
  }
  if (!PHONE_PATTERN.test(phone) || phoneDigits.length < 7 || phoneDigits.length > 15) {
    return res.status(400).json({ message: 'Please enter a valid phone number with 7 to 15 digits.' });
  }
  if (!email) return res.status(400).json({ message: 'Please enter your email address.' });
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address.' });
  }
  if (!message) return res.status(400).json({ message: 'Please enter a message.' });
  if (message.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ message: 'Your message must be 5000 characters or fewer.' });
  }

  try {
    await ContactInquiry.create({ name, phone, email, message });
    return res.status(201).json({
      message: 'Thank you for contacting UI Fragrance. Your message has been received.',
    });
  } catch (error) {
    console.error('Failed to save contact inquiry:', error);
    return res.status(500).json({ message: 'We could not send your message. Please try again.' });
  }
});

router.get('/', protectAdmin, async (req, res) => {
  try {
    const inquiries = await ContactInquiry.find()
      .select('name phone email message createdAt')
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json(inquiries);
  } catch (error) {
    console.error('Failed to fetch contact inquiries:', error);
    return res.status(500).json({ message: 'Server error while fetching contact inquiries.' });
  }
});

module.exports = router;
