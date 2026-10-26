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
  passwordResetOtpHash: { type: String, select: false },
  passwordResetOtpExpiresAt: { type: Date, select: false },
  passwordResetOtpAttempts: { type: Number, select: false, default: 0 },
  passwordResetOtpSentAt: { type: Date, select: false },
  passwordResetTokenHash: { type: String, select: false },
  passwordResetTokenExpiresAt: { type: Date, select: false },
}, { timestamps: true });

// 👇 VERY IMPORTANT
module.exports = mongoose.model('User', userSchema);
