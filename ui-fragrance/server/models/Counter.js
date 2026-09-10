const mongoose = require('mongoose');

// Used to generate auto-incrementing Order IDs like UIF-1001, UIF-1002, ...
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 1000 },
});

module.exports = mongoose.model('Counter', counterSchema);
