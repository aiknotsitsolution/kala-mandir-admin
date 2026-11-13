const nodemailer = require("nodemailer");
const path = require("node:path");

const port = Number(process.env.EMAIL_PORT || 465);
const senderEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
const defaultSenderName = process.env.EMAIL_FROM_NAME || "Kala Mandir";
const replyToEmail = process.env.REPLY_TO_EMAIL || process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
const emailLogoPath = path.join(__dirname, "..", "assets", "kalamandir-email-logo.png");

const getInlineEmailLogo = () => ({
  filename: "kalamandir-email-logo.png",
  path: emailLogoPath,
  cid: "kala-mandir-email-logo",
});

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port,
  secure: port === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS?.replace(/\s/g, ""),
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
});

const buildFromAddress = (customFrom) => {
  if (customFrom) return customFrom;
  if (!senderEmail) return null;
  return `"${defaultSenderName}" <${senderEmail}>`;
};

const prepareMailOptions = (options = {}) => {
  const mailOptions = { ...options };
  const fromAddress = buildFromAddress(mailOptions.from);

  if (!fromAddress) {
    throw new Error("Email sender configuration is incomplete");
  }

  mailOptions.from = fromAddress;
  mailOptions.replyTo = mailOptions.replyTo || replyToEmail || fromAddress;
  mailOptions.headers = {
    ...(mailOptions.headers || {}),
    "X-Mailer": "Kala Mandir Mailer",
    "X-Website": "Kala Mandir Admin",
  };

  if (!mailOptions.text && mailOptions.html) {
    mailOptions.text = String(mailOptions.html).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }

  return mailOptions;
};

const sendMail = (options = {}) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !senderEmail) {
    throw new Error("Email sender configuration is incomplete");
  }

  return transporter.sendMail(prepareMailOptions(options));
};

module.exports = { sendMail, prepareMailOptions, buildFromAddress, getInlineEmailLogo };
