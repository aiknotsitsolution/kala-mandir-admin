const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  loginOtpHash: { type: String, select: false },
  loginOtpExpiresAt: { type: Date, select: false },
  loginOtpAttempts: { type: Number, select: false, default: 0 },
  loginOtpSentAt: { type: Date, select: false },
}, { timestamps: true });

// 👇 VERY IMPORTANT
module.exports = mongoose.model('User', userSchema);
