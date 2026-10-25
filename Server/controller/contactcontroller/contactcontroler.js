const Contact = require("../../module/contactmodule/contactmodule.js"); // adjust path
const nodemailer = require("nodemailer");
const axios = require("axios");
const mongoose = require("mongoose");

const transporter = nodemailer.createTransport({
  host: "smtpout.secureserver.net",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // ⚠️ helps if SSL issues
  },
  connectionTimeout: 10000,
});

// ✅ Verify transporter (non-blocking)
transporter.verify((error) => {
  if (error) {
    console.warn("⚠️ Email transporter warning:", error.message);
  } else {
    console.log("✅ Email transporter is ready");
  }
});

// ✅ Main Controller
const createContactMessage = async (req, res) => {
  try {
    let { name, email, phone, subject, message, country, captcha } = req.body;

    // Sanitize
    name = String(name || "").trim();
    email = String(email || "")
      .trim()
      .toLowerCase();
    phone = String(phone || "").trim();
    subject = String(subject || "Other").trim();
    message = String(message || "").trim();
    country = String(country || "").trim();

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Name, email, subject and message are required",
      });
    }

    if (!captcha) {
      return res.status(400).json({
        success: false,
        message: "reCAPTCHA verification is required",
      });
    }

    // ✅ Verify reCAPTCHA
    const recaptchaRes = await axios.post(
      "https://www.google.com/recaptcha/api/siteverify",
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: captcha,
          remoteip: req.ip,
        },
      },
    );

    if (!recaptchaRes.data.success) {
      return res.status(400).json({
        success: false,
        message: "reCAPTCHA verification failed",
      });
    }

    // ✅ Save to DB
    await Contact.create({
      username: name,
      email,
      phone: phone || undefined,
      subject,
      message,
      country: country || undefined,
    });

    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

    // ✅ Send Email to Admin
    const adminMail = transporter.sendMail({
      from: `"Website Enquiry" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: `New Enquiry: ${subject}`,
      html: `
        <h2 style="color:#c0392b;">New Contact Message</h2>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Phone:</b> ${phone || "—"}</p>
        <p><b>Subject:</b> ${subject}</p>
        <p><b>Message:</b><br>${message.replace(/\n/g, "<br>")}</p>
      `,
    });

    // ✅ Send Email to User
    const userMail = transporter.sendMail({
      from: `"Edu-hawk World" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Thank You – We Received Your Inquiry",
      html: `
        <h2>Hello ${name},</h2>
        <p>Thank you for contacting us. We will get back to you soon.</p>
        <p><b>Your message:</b><br>${message.replace(/\n/g, "<br>")}</p>
      `,
    });

    // ✅ Run both emails parallel
    await Promise.all([adminMail, userMail]);

    return res.status(201).json({
      success: true,
      message: "Message sent successfully!",
    });
  } catch (error) {
    console.error("❌ Contact form error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

const getContactMessages = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 }).lean(); // faster + plain JS objects

    return res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts,
    });
  } catch (error) {
    console.error("Get contacts error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not fetch messages",
    });
  }
};

const deleteContactMessage = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID",
      });
    }

    const deleted = await Contact.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("Delete contact error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete message",
    });
  }
};

module.exports = {
  createContactMessage,
  getContactMessages,
  deleteContactMessage,
};
