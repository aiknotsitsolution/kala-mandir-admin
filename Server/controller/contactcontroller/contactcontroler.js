const Contact = require("../../module/contactmodule/contactmodule.js"); // adjust path
const nodemailer = require("nodemailer");
const axios = require("axios");
const mongoose = require("mongoose");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: Number(process.env.EMAIL_PORT || 465),
  secure: Number(process.env.EMAIL_PORT || 465) === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS?.replace(/\s/g, ""),
  },
  connectionTimeout: 10000,
});

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);

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

const createWebsiteEnquiry = async (req, res) => {
  const name = String(req.body.name || "").trim();
  const phone = String(req.body.phone || "").trim();
  const interest = String(req.body.interest || "").trim();
  const ageGroup = String(req.body.ageGroup || "").trim();
  const preferredContact = String(req.body.method || "").trim();
  const message = String(req.body.message || "").trim();
  const company = String(req.body.company || "").trim();

  if (company) return res.status(201).json({ success: true, message: "Enquiry received" });
  if (!name || !phone || !interest || !preferredContact) {
    return res.status(400).json({
      success: false,
      message: "Name, phone, interest and preferred contact method are required",
    });
  }
  if (name.length > 80 || phone.length > 20 || interest.length > 100 ||
    ageGroup.length > 40 || preferredContact.length > 30 || message.length > 600) {
    return res.status(400).json({ success: false, message: "One or more enquiry fields are too long" });
  }
  if (!/^(\+?91[-\s]?)?[6-9]\d{9}$/.test(phone)) {
    return res.status(400).json({ success: false, message: "Enter a valid 10-digit Indian mobile number" });
  }
  if (!["WhatsApp", "Phone call", "SMS"].includes(preferredContact)) {
    return res.status(400).json({ success: false, message: "Select a valid contact method" });
  }

  try {
    const enquiry = await Contact.create({
      username: name,
      phone,
      subject: interest,
      interest,
      ageGroup,
      preferredContact,
      message: message || "No additional message provided.",
      source: "website-enquiry",
    });
    const notificationRecipient =
      process.env.ADMIN_EMAIL || process.env.EMAIL_TO || process.env.EMAIL_USER;
    try {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !notificationRecipient) {
        throw new Error("Email notification configuration is incomplete");
      }
      await transporter.sendMail({
        from: `"Kala Mandir Website" <${process.env.EMAIL_USER}>`,
        to: notificationRecipient,
        subject: `New Kala Mandir enquiry: ${interest}`,
        text: [
          "A new enquiry was submitted on the Kala Mandir website.",
          `Name: ${name}`,
          `Phone: ${phone}`,
          `Interested in: ${interest}`,
          `Age group: ${ageGroup || "Not provided"}`,
          `Preferred contact: ${preferredContact}`,
          `Message: ${message || "No additional message provided."}`,
        ].join("\n"),
        html: `
          <h2>New Kala Mandir website enquiry</h2>
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
          <p><strong>Interested in:</strong> ${escapeHtml(interest)}</p>
          <p><strong>Age group:</strong> ${escapeHtml(ageGroup || "Not provided")}</p>
          <p><strong>Preferred contact:</strong> ${escapeHtml(preferredContact)}</p>
          <p><strong>Message:</strong><br>${escapeHtml(message || "No additional message provided.").replace(/\r?\n/g, "<br>")}</p>
        `,
      });
    } catch (emailError) {
      console.error("Website enquiry email notification failed:", emailError.message);
    }
    return res.status(201).json({
      success: true,
      message: "Your enquiry has been received",
      data: { id: enquiry.id },
    });
  } catch (error) {
    console.error("Website enquiry save failed:", error.message);
    return res.status(500).json({
      success: false,
      message: "Could not save your enquiry. Please try again.",
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
  createWebsiteEnquiry,
  getContactMessages,
  deleteContactMessage,
};
