const nodemailer = require("nodemailer");
const path = require("node:path");

const port = Number(process.env.EMAIL_PORT || 465);
const fallbackPort = port === 465 ? 587 : port === 587 ? 465 : null;
const senderEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
const defaultSenderName = process.env.EMAIL_FROM_NAME || "Kala Mandir";
const replyToEmail = process.env.REPLY_TO_EMAIL || process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
const emailLogoPath = path.join(__dirname, "..", "assets", "kalamandir-email-logo.jpg");
const host = process.env.EMAIL_HOST || "smtp.gmail.com";
const password = process.env.EMAIL_PASS?.replace(/\s/g, "");

const createTransporter = (smtpPort) => nodemailer.createTransport({
  host,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: password,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 20000,
  ...(smtpPort === 587 ? { requireTLS: true } : {}),
});

const transporters = new Map([[port, createTransporter(port)]]);

const getTransporter = (smtpPort) => {
  if (!transporters.has(smtpPort)) {
    transporters.set(smtpPort, createTransporter(smtpPort));
  }
  return transporters.get(smtpPort);
};

const getInlineEmailLogo = () => ({
  filename: "kalamandir-email-logo.jpg",
  path: emailLogoPath,
  cid: "kala-mandir-email-logo",
  contentType: "image/jpeg",
  contentDisposition: "inline",
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

const isSmtpConnectionError = (error) =>
  ["ETIMEDOUT", "ECONNECTION", "ESOCKET", "ECONNREFUSED", "ECONNRESET"].includes(error.code) &&
  (!error.command || ["CONN", "CONNECT", "STARTTLS"].includes(error.command));

const sendMail = async (options = {}) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !senderEmail) {
    throw new Error("Email sender configuration is incomplete");
  }

  const mailOptions = prepareMailOptions(options);
  try {
    return await getTransporter(port).sendMail(mailOptions);
  } catch (primaryError) {
    if (!fallbackPort || !isSmtpConnectionError(primaryError)) {
      throw primaryError;
    }

    try {
      const result = await getTransporter(fallbackPort).sendMail(mailOptions);
      console.warn(`SMTP delivery succeeded using fallback port ${fallbackPort}.`);
      return result;
    } catch (fallbackError) {
      fallbackError.message =
        `SMTP delivery failed on configured port ${port} (${primaryError.message}) ` +
        `and fallback port ${fallbackPort}: ${fallbackError.message}`;
      throw fallbackError;
    }
  }
};

module.exports = { sendMail, prepareMailOptions, buildFromAddress, getInlineEmailLogo };
