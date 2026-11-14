const Contact = require("../../module/contactmodule/contactmodule.js"); // adjust path
const axios = require("axios");
const mongoose = require("mongoose");
const { sendMail, getInlineEmailLogo } = require("../../utils/mailer");

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);

const renderContactEmail = ({ preheader, title, greeting, intro, details, footer }) => `
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f2f7;padding:28px 12px;font-family:Arial,Helvetica,sans-serif;color:#302638;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;">
        <tr><td align="center" style="background:#210b2c;padding:22px 20px;">
          <img src="cid:kala-mandir-email-logo" width="240" alt="Kala Mandir — Art, Dance, Creativity" style="display:block;width:240px;max-width:90%;height:auto;border:0;">
        </td></tr>
        <tr><td style="padding:32px 32px 12px;">
          <p style="margin:0 0 8px;color:#98752c;font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">${escapeHtml(preheader)}</p>
          <h1 style="margin:0 0 18px;color:#271231;font-size:25px;line-height:1.3;">${escapeHtml(title)}</h1>
          <p style="margin:0 0 12px;font-size:16px;line-height:1.7;">${escapeHtml(greeting)}</p>
          <p style="margin:0 0 22px;color:#625b66;font-size:15px;line-height:1.7;">${escapeHtml(intro)}</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf8fb;border:1px solid #eee8f0;border-radius:10px;">
            ${details.map(({ label, value }) => `
              <tr><td style="padding:12px 15px;border-bottom:1px solid #eee8f0;vertical-align:top;">
                <p style="margin:0 0 5px;color:#766b7c;font-size:12px;font-weight:bold;letter-spacing:.5px;text-transform:uppercase;">${escapeHtml(label)}</p>
                <p style="margin:0;color:#302638;font-size:14px;line-height:1.65;overflow-wrap:anywhere;">${escapeHtml(value).replace(/\r?\n/g, "<br>")}</p>
              </td></tr>
            `).join("")}
          </table>
          <p style="margin:22px 0 0;color:#625b66;font-size:14px;line-height:1.7;">${escapeHtml(footer || "We appreciate you reaching out and will get back to you soon.")}</p>
        </td></tr>
        <tr><td align="center" style="padding:20px 24px 24px;color:#817887;font-size:12px;line-height:1.6;">
          Kala Mandir · Art, Dance &amp; Creativity<br>
          This is an automated confirmation of your contact form submission.
        </td></tr>
      </table>
    </td></tr>
  </table>
`;

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
    const fromAddress = `"${process.env.EMAIL_FROM_NAME || "Kala Mandir"}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`;
    const replyToAddress = process.env.REPLY_TO_EMAIL || process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    const emailDetails = [
      { label: "Name", value: name },
      { label: "Email", value: email },
      { label: "Phone", value: phone || "Not provided" },
      { label: "Subject", value: subject },
      { label: "Message", value: message },
    ];

    // ✅ Send Email to Admin
    const adminMail = sendMail({
      from: fromAddress,
      replyTo: email,
      to: adminEmail,
      subject: `New Enquiry: ${subject}`,
      text: [
        "New Kala Mandir contact message",
        `Name: ${name}`,
        `Email: ${email}`,
        `Phone: ${phone || "Not provided"}`,
        `Subject: ${subject}`,
        `Message: ${message}`,
      ].join("\n"),
      html: renderContactEmail({
        preheader: "New website contact message",
        title: "A new message has arrived",
        greeting: "Website contact form",
        intro: "A visitor has sent a message to Kala Mandir. You can reply directly to this email to respond to them.",
        details: emailDetails,
      }),
      attachments: [getInlineEmailLogo()],
    });

    // ✅ Send Email to User
    const userMail = sendMail({
      from: fromAddress,
      replyTo: replyToAddress,
      to: email,
      subject: "Thank You – We Received Your Inquiry",
      text: [
        `Hello ${name},`,
        "",
        "Thank you for contacting Kala Mandir. We have received your message and will get back to you soon.",
        "",
        `Subject: ${subject}`,
        `Your message: ${message}`,
      ].join("\n"),
      html: renderContactEmail({
        preheader: "We have received your message",
        title: "Thank you for reaching out!",
        greeting: `Hello ${name},`,
        intro: "Your message has safely reached the Kala Mandir team. We will review it and get back to you soon.",
        details: [
          { label: "Subject", value: subject },
          { label: "Your message", value: message },
        ],
      }),
      attachments: [getInlineEmailLogo()],
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
  const email = String(req.body.email || "").trim().toLowerCase();
  const phone = String(req.body.phone || "").trim();
  const interest = String(req.body.interest || "").trim();
  const ageGroup = String(req.body.ageGroup || "").trim();
  const message = String(req.body.message || "").trim();
  const company = String(req.body.company || "").trim();

  if (company) return res.status(201).json({ success: true, message: "Enquiry received" });
  if (!name || !email || !phone || !interest) {
    return res.status(400).json({
      success: false,
      message: "Name, email, phone and interest are required",
    });
  }
  if (name.length > 80 || email.length > 254 || phone.length > 20 || interest.length > 100 ||
    ageGroup.length > 40 || message.length > 600) {
    return res.status(400).json({ success: false, message: "One or more enquiry fields are too long" });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: "Enter a valid email address" });
  }
  if (!/^(\+?91[-\s]?)?[6-9]\d{9}$/.test(phone)) {
    return res.status(400).json({ success: false, message: "Enter a valid 10-digit Indian mobile number" });
  }
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: "The database is unavailable. Your enquiry was not saved. Please try again shortly.",
    });
  }

  try {
    const enquiry = await Contact.create({
      username: name,
      email,
      phone,
      subject: interest,
      interest,
      ageGroup,
      message: message || "No additional message provided.",
      source: "website-enquiry",
    });
    const notificationRecipient =
      process.env.ADMIN_EMAIL || process.env.EMAIL_TO || process.env.EMAIL_USER;
    const fromAddress = `"${process.env.EMAIL_FROM_NAME || "Kala Mandir"}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`;
    const replyToAddress = process.env.REPLY_TO_EMAIL || process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    let adminEmailSent = false;
    let userEmailSent = false;
    try {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !notificationRecipient) {
        throw new Error("Email notification configuration is incomplete");
      }
      await sendMail({
        from: fromAddress,
        replyTo: email,
        to: notificationRecipient,
        subject: `New Kala Mandir enquiry: ${interest}`,
        text: [
          "A new enquiry was submitted on the Kala Mandir website.",
          `Name: ${name}`,
          `Email: ${email}`,
          `Phone: ${phone}`,
          `Interested in: ${interest}`,
          `Age group: ${ageGroup || "Not provided"}`,
          `Message: ${message || "No additional message provided."}`,
        ].join("\n"),
        html: renderContactEmail({
          preheader: "New website enquiry",
          title: "A new enquiry has arrived",
          greeting: "Website enquiry",
          intro: "A visitor has sent an enquiry to Kala Mandir. Reply directly to this email to respond to them.",
          details: [
            { label: "Name", value: name },
            { label: "Email", value: email },
            { label: "Phone", value: phone },
            { label: "Interested in", value: interest },
            { label: "Age group", value: ageGroup || "Not provided" },
            { label: "Message", value: message || "No additional message provided." },
          ],
          footer: "You can reply directly to this email to contact the visitor.",
        }),
        attachments: [getInlineEmailLogo()],
      });
      adminEmailSent = true;
    } catch (emailError) {
      console.error("Website enquiry email notification failed:", emailError);
    }

    try {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error("User confirmation email configuration is incomplete");
      }
      await sendMail({
        from: fromAddress,
        replyTo: replyToAddress,
        to: email,
        subject: "Thank You – We Received Your Enquiry",
        text: [
          `Hello ${name},`,
          "",
          "Thank you for contacting Kala Mandir. We have received your enquiry and will be in touch soon.",
          "",
          `Interested in: ${interest}`,
          `Phone: ${phone}`,
          "",
          "Warm regards,",
          "Kala Mandir Team",
        ].join("\n"),
        html: renderContactEmail({
          preheader: "We have received your enquiry",
          title: "Thank you for reaching out!",
          greeting: `Hello ${name},`,
          intro: "Your enquiry has safely reached the Kala Mandir team. We will review it and get back to you soon.",
          details: [
            { label: "Interested in", value: interest },
            { label: "Phone", value: phone },
            { label: "Age group", value: ageGroup || "Not provided" },
            { label: "Message", value: message || "No additional message provided." },
          ],
          footer: "Warm regards, Kala Mandir Team",
        }),
        attachments: [getInlineEmailLogo()],
      });
      userEmailSent = true;
    } catch (emailError) {
      console.error("Website enquiry acknowledgement email failed:", emailError);
    }

    const emailSent = adminEmailSent && userEmailSent;
    return res.status(201).json({
      success: true,
      message: "Your enquiry has been received",
      data: { id: enquiry.id, emailSent },
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
