const router = require("express").Router();
const {
  registerUser,
  loginUser,
  resendLoginOtp,
  verifyLoginOtp,
} = require("../controller/auth/authcontroler");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/resend-otp", resendLoginOtp);
router.post("/verify-otp", verifyLoginOtp);

module.exports = router;
