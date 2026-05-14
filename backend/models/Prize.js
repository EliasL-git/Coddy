const mongoose = require('mongoose');

const prizeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    emoji: { type: String, default: '🎁' },
    coinCost: { type: Number, required: true, min: 0 },
    stock: { type: Number, default: -1 }, // -1 = unlimited
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Prize', prizeSchema);
