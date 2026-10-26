const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('node:crypto');
const User = require('../../module/authmodule/authmodule');
const { sendMail } = require('../../utils/mailer');

const OTP_LIFETIME_MS = 5 * 60 * 1000;
const OTP_RESEND_INTERVAL_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const PASSWORD_RESET_TOKEN_LIFETIME_MS = 10 * 60 * 1000;

const createOtpHash = (otp) => crypto
  .createHmac('sha256', process.env.JWT_SECRET || 'mysecretkey')
  .update(otp)
  .digest('hex');

const createSession = (user) => ({
  token: jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET || 'mysecretkey',
    { expiresIn: '1d' }
  ),
  user: {
    id: user._id,
    username: user.username,
    email: user.email,
    profilePhotoUrl: user.profilePhotoUrl || "",
  }
});

const deliverLoginOtp = async (user) => {
  const now = Date.now();
  if (user.loginOtpSentAt && now - user.loginOtpSentAt.getTime() < OTP_RESEND_INTERVAL_MS) {
    return { retryAfter: Math.ceil((OTP_RESEND_INTERVAL_MS - (now - user.loginOtpSentAt.getTime())) / 1000) };
  }

  const otp = crypto.randomInt(0, 1000000).toString().padStart(6, '0');
  user.loginOtpHash = createOtpHash(otp);
  user.loginOtpExpiresAt = new Date(now + OTP_LIFETIME_MS);
  user.loginOtpAttempts = 0;
  user.loginOtpSentAt = new Date(now);
  await user.save();

  try {
    await sendMail({
      to: user.email,
      subject: 'Your Kala Mandir admin login code',
      text: `Hello ${user.username}, your Kala Mandir admin verification code is ${otp}. It expires in 5 minutes. If you did not request this code, you can ignore this email.`,
      html: `<p>Hello ${escapeHtml(user.username)},</p><p>Your Kala Mandir admin verification code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:8px">${otp}</p><p>This code expires in 5 minutes. If you did not request it, you can ignore this email.</p>`,
    });
  } catch (error) {
    user.loginOtpHash = undefined;
    user.loginOtpExpiresAt = undefined;
    user.loginOtpAttempts = 0;
    user.loginOtpSentAt = undefined;
    await user.save();
    throw error;
  }

  return { retryAfter: 0 };
};

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]));

const clearPasswordResetOtp = (user) => {
  user.passwordResetOtpHash = undefined;
  user.passwordResetOtpExpiresAt = undefined;
  user.passwordResetOtpAttempts = 0;
  user.passwordResetOtpSentAt = undefined;
};

const requestPasswordReset = async (req, res) => {
  const normalizedEmail = String(req.body.email || '').trim().toLowerCase();
  if (!normalizedEmail) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  try {
    const user = await User.findOne({ email: normalizedEmail })
      .select('+passwordResetOtpHash +passwordResetOtpExpiresAt +passwordResetOtpAttempts +passwordResetOtpSentAt');

    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an admin account exists for this email, a reset code will be sent.',
      });
    }

    const now = Date.now();
    if (user.passwordResetOtpSentAt && now - user.passwordResetOtpSentAt.getTime() < OTP_RESEND_INTERVAL_MS) {
      return res.status(200).json({
        success: true,
        message: 'If an admin account exists for this email, a reset code will be sent.',
      });
    }

    const otp = crypto.randomInt(0, 1000000).toString().padStart(6, '0');
    user.passwordResetOtpHash = createOtpHash(otp);
    user.passwordResetOtpExpiresAt = new Date(now + OTP_LIFETIME_MS);
    user.passwordResetOtpAttempts = 0;
    user.passwordResetOtpSentAt = new Date(now);
    user.passwordResetTokenHash = undefined;
    user.passwordResetTokenExpiresAt = undefined;
    await user.save();

    try {
      await sendMail({
        to: user.email,
        subject: 'Your Kala Mandir password reset code',
        text: `Hello ${user.username}, your Kala Mandir password reset code is ${otp}. It expires in 5 minutes. If you did not request this code, you can ignore this email.`,
        html: `<p>Hello ${escapeHtml(user.username)},</p><p>Your Kala Mandir password reset code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:8px">${otp}</p><p>This code expires in 5 minutes. If you did not request it, you can ignore this email.</p>`,
      });
    } catch (error) {
      clearPasswordResetOtp(user);
      await user.save();
      throw error;
    }

    return res.status(200).json({
      success: true,
      message: 'If an admin account exists for this email, a reset code will be sent.',
    });
  } catch (err) {
    console.error('Admin password reset code delivery failed:', err.message);
    return res.status(503).json({
      success: false,
      message: 'Could not send the reset code. Check the mail configuration and try again.',
    });
  }
};

const verifyPasswordResetOtp = async (req, res) => {
  const normalizedEmail = String(req.body.email || '').trim().toLowerCase();
  const otp = String(req.body.otp || '').trim();
  if (!normalizedEmail || !/^\d{6}$/.test(otp)) {
    return res.status(400).json({ success: false, message: 'Enter the 6-digit reset code' });
  }

  try {
    const user = await User.findOne({ email: normalizedEmail })
      .select('+passwordResetOtpHash +passwordResetOtpExpiresAt +passwordResetOtpAttempts');
    if (!user || !user.passwordResetOtpHash || !user.passwordResetOtpExpiresAt) {
      return res.status(400).json({ success: false, message: 'Request a new reset code to continue' });
    }

    if (user.passwordResetOtpExpiresAt.getTime() <= Date.now()) {
      clearPasswordResetOtp(user);
      await user.save();
      return res.status(400).json({ success: false, message: 'Reset code expired. Request a new code.' });
    }

    if (user.passwordResetOtpAttempts >= OTP_MAX_ATTEMPTS) {
      clearPasswordResetOtp(user);
      await user.save();
      return res.status(429).json({ success: false, message: 'Too many incorrect attempts. Request a new code.' });
    }

    const suppliedHash = Buffer.from(createOtpHash(otp), 'hex');
    const storedHash = Buffer.from(user.passwordResetOtpHash, 'hex');
    const isMatch = suppliedHash.length === storedHash.length &&
      crypto.timingSafeEqual(suppliedHash, storedHash);
    if (!isMatch) {
      user.passwordResetOtpAttempts += 1;
      if (user.passwordResetOtpAttempts >= OTP_MAX_ATTEMPTS) {
        clearPasswordResetOtp(user);
      }
      await user.save();
      return res.status(401).json({ success: false, message: 'Incorrect reset code' });
    }

    clearPasswordResetOtp(user);
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetTokenHash = createOtpHash(resetToken);
    user.passwordResetTokenExpiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_LIFETIME_MS);
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Code verified. You can now set a new password.',
      resetToken,
    });
  } catch (err) {
    console.error('Admin password reset code verification failed:', err.message);
    return res.status(500).json({ success: false, message: 'Could not verify the code. Please try again.' });
  }
};

const resetPassword = async (req, res) => {
  const normalizedEmail = String(req.body.email || '').trim().toLowerCase();
  const resetToken = String(req.body.resetToken || '');
  const { password, confirmPassword } = req.body;

  if (!normalizedEmail || !resetToken || !password || !confirmPassword) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'Passwords do not match' });
  }

  try {
    const user = await User.findOne({ email: normalizedEmail })
      .select('+passwordResetTokenHash +passwordResetTokenExpiresAt +loginOtpHash +loginOtpExpiresAt +loginOtpAttempts +loginOtpSentAt');
    if (!user || !user.passwordResetTokenHash || !user.passwordResetTokenExpiresAt) {
      return res.status(400).json({ success: false, message: 'Password reset session expired. Request a new code.' });
    }

    if (user.passwordResetTokenExpiresAt.getTime() <= Date.now()) {
      user.passwordResetTokenHash = undefined;
      user.passwordResetTokenExpiresAt = undefined;
      await user.save();
      return res.status(400).json({ success: false, message: 'Password reset session expired. Request a new code.' });
    }

    const suppliedHash = Buffer.from(createOtpHash(resetToken), 'hex');
    const storedHash = Buffer.from(user.passwordResetTokenHash, 'hex');
    const isMatch = suppliedHash.length === storedHash.length &&
      crypto.timingSafeEqual(suppliedHash, storedHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password reset session. Request a new code.' });
    }

    user.password = await bcrypt.hash(password, 10);
    user.passwordResetTokenHash = undefined;
    user.passwordResetTokenExpiresAt = undefined;
    user.loginOtpHash = undefined;
    user.loginOtpExpiresAt = undefined;
    user.loginOtpAttempts = 0;
    user.loginOtpSentAt = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully.',
      ...createSession(user),
    });
  } catch (err) {
    console.error('Admin password reset failed:', err.message);
    return res.status(500).json({ success: false, message: 'Could not reset the password. Please try again.' });
  }
};

// REGISTER USER
const registerUser = async (req, res) => {
  const { username, email, password } = req.body;
  const normalizedEmail = email?.trim().toLowerCase();

  try {
    if (!username?.trim() || !normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }

    if (await User.exists({})) {
      return res.status(403).json({
        success: false,
        message: 'Admin registration is closed because an account already exists'
      });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      username: username.trim(),
      email: normalizedEmail,
      password: hashedPassword
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful. Sign in to receive your email verification code.',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};


// LOGIN USER
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email?.trim().toLowerCase();

  try {
    if (!normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const user = await User.findOne({ email: normalizedEmail })
      .select('+loginOtpHash +loginOtpExpiresAt +loginOtpAttempts +loginOtpSentAt');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const { retryAfter } = await deliverLoginOtp(user);
    if (retryAfter) {
      return res.status(429).json({
        success: false,
        message: `A verification code was recently sent. Try again in ${retryAfter} seconds.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: `A verification code has been sent to ${user.email}.`,
      data: { email: user.email },
    });

  } catch (err) {
    console.error('Admin login OTP delivery failed:', err.message);
    return res.status(503).json({
      success: false,
      message: 'Could not send the verification code. Check the mail configuration and try again.',
    });
  }
};

const resendLoginOtp = async (req, res) => {
  const normalizedEmail = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!normalizedEmail || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ email: normalizedEmail })
      .select('+loginOtpHash +loginOtpExpiresAt +loginOtpAttempts +loginOtpSentAt');
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const { retryAfter } = await deliverLoginOtp(user);
    if (retryAfter) {
      return res.status(429).json({
        success: false,
        message: `A verification code was recently sent. Try again in ${retryAfter} seconds.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: `A new verification code has been sent to ${user.email}.`,
    });
  } catch (err) {
    console.error('Admin login OTP resend failed:', err.message);
    return res.status(503).json({
      success: false,
      message: 'Could not send the verification code. Check the mail configuration and try again.',
    });
  }
};

const verifyLoginOtp = async (req, res) => {
  const normalizedEmail = String(req.body.email || '').trim().toLowerCase();
  const otp = String(req.body.otp || '').trim();
  if (!normalizedEmail || !/^\d{6}$/.test(otp)) {
    return res.status(400).json({ success: false, message: 'Enter the 6-digit verification code' });
  }

  try {
    const user = await User.findOne({ email: normalizedEmail })
      .select('+loginOtpHash +loginOtpExpiresAt +loginOtpAttempts +loginOtpSentAt');
    if (!user || !user.loginOtpHash || !user.loginOtpExpiresAt) {
      return res.status(400).json({ success: false, message: 'Request a new verification code to continue' });
    }

    if (user.loginOtpExpiresAt.getTime() <= Date.now()) {
      user.loginOtpHash = undefined;
      user.loginOtpExpiresAt = undefined;
      user.loginOtpAttempts = 0;
      await user.save();
      return res.status(400).json({ success: false, message: 'Verification code expired. Request a new code.' });
    }

    if (user.loginOtpAttempts >= OTP_MAX_ATTEMPTS) {
      user.loginOtpHash = undefined;
      user.loginOtpExpiresAt = undefined;
      user.loginOtpAttempts = 0;
      await user.save();
      return res.status(429).json({ success: false, message: 'Too many incorrect attempts. Request a new code.' });
    }

    const suppliedHash = Buffer.from(createOtpHash(otp), 'hex');
    const storedHash = Buffer.from(user.loginOtpHash, 'hex');
    const isMatch = suppliedHash.length === storedHash.length &&
      crypto.timingSafeEqual(suppliedHash, storedHash);
    if (!isMatch) {
      user.loginOtpAttempts += 1;
      if (user.loginOtpAttempts >= OTP_MAX_ATTEMPTS) {
        user.loginOtpHash = undefined;
        user.loginOtpExpiresAt = undefined;
        user.loginOtpAttempts = 0;
      }
      await user.save();
      return res.status(401).json({ success: false, message: 'Incorrect verification code' });
    }

    user.loginOtpHash = undefined;
    user.loginOtpExpiresAt = undefined;
    user.loginOtpAttempts = 0;
    user.loginOtpSentAt = undefined;
    await user.save();
    return res.status(200).json({
      success: true,
      message: 'Login verified',
      ...createSession(user),
    });
  } catch (err) {
    console.error('Admin login OTP verification failed:', err.message);
    return res.status(500).json({ success: false, message: 'Could not verify the code. Please try again.' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  resendLoginOtp,
  verifyLoginOtp,
  requestPasswordReset,
  verifyPasswordResetOtp,
  resetPassword,
};
