const mongoose = require('mongoose');

const contactInquirySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Your name is required'],
      trim: true,
      maxlength: 120,
    },
    phone: {
      type: String,
      required: [true, 'Your phone number is required'],
      trim: true,
      maxlength: 30,
    },
    email: {
      type: String,
      required: [true, 'Your email address is required'],
      trim: true,
      lowercase: true,
      maxlength: 254,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    message: {
      type: String,
      required: [true, 'Your message is required'],
      trim: true,
      maxlength: 5000,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ContactInquiry', contactInquirySchema);
