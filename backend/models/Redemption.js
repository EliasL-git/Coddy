const mongoose = require('mongoose');

const redemptionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    prizeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prize', required: true },
    prizeName: { type: String, required: true },  // snapshot at time of redemption
    coinCost: { type: Number, required: true },   // snapshot at time of redemption
    status: {
      type: String,
      enum: ['pending', 'fulfilled', 'rejected'],
      default: 'pending',
    },
    adminNote: { type: String, default: '' },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Redemption', redemptionSchema);
