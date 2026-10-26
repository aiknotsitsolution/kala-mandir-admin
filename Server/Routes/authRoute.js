const router = require("express").Router();
const {
  registerUser,
  loginUser,
  resendLoginOtp,
  verifyLoginOtp,
  requestPasswordReset,
  verifyPasswordResetOtp,
  resetPassword,
} = require("../controller/auth/authcontroler");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/resend-otp", resendLoginOtp);
router.post("/verify-otp", verifyLoginOtp);
router.post("/forgot-password", requestPasswordReset);
router.post("/verify-password-reset-otp", verifyPasswordResetOtp);
router.post("/reset-password", resetPassword);

module.exports = router;
