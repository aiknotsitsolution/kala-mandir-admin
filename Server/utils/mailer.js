const nodemailer = require("nodemailer");

const port = Number(process.env.EMAIL_PORT || 465);

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port,
  secure: port === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS?.replace(/\s/g, ""),
  },
  connectionTimeout: 10000,
});

const sendMail = (options) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("Email sender configuration is incomplete");
  }
  return transporter.sendMail({
    ...options,
    from: options.from || `"Kala Mandir" <${process.env.EMAIL_USER}>`,
  });
};

module.exports = { sendMail };
