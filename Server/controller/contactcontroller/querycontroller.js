const Contact = require("../../module/querymodule/querymodule");
const nodemailer = require("nodemailer");

// ✅ Keep ONE transporter at the top (Best Practice)
const transporter = nodemailer.createTransport({
  host: "smtpout.secureserver.net", // Godaddy
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
});

// Verify transporter (non-blocking)
transporter.verify((error) => {
  if (error) {
    console.warn("⚠️ Email transporter warning:", error.message);
  } else {
    console.log("✅ Email transporter is ready");
  }
});

// ====================== Create Query ======================
const Createquery = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      city,
      country,
      interested,
      neetStatus,
      message,
    } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name, Email and Phone are required",
      });
    }

    const savedMessage = String(message || "").trim() || "No message provided.";

    // Save to Database
    const newQuery = await Contact.create({
      name,
      email,
      phone,
      city,
      country,
      interested,
      neetStatus,
      message: savedMessage,
    });

    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

    // 1. Send Mail to Admin
    try {
      await transporter.sendMail({
        from: `"Website Enquiry" <${process.env.EMAIL_USER}>`,
        to: adminEmail,
        subject: `New Enquiry from ${name}`,
        html: `
          <h2>New Student Enquiry</h2>
          <p><b>Name:</b> ${name}</p>
          <p><b>Email:</b> ${email}</p>
          <p><b>Phone:</b> ${phone}</p>
          <p><b>City:</b> ${city || "-"}</p>
          <p><b>Country:</b> ${country || "-"}</p>
          <p><b>Interested In:</b> ${interested || "Yes"}</p>
          <p><b>NEET Status:</b> ${neetStatus || "Not provided"}</p>
          <p><b>Message:</b> ${savedMessage.replace(/\n/g, "<br>")}</p>
          <small>Received: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</small>
        `,
      });
      console.log(`📧 Admin email sent for ${email}`);
    } catch (err) {
      console.error("❌ Admin mail failed:", err.message);
    }

    // 2. Send Thank You Mail to User (Improved)
    try {
      await transporter.sendMail({
        from: `"Edu-hawk World" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Thank You for Contacting Edu-hawk World!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">Hello ${name},</h2>
            
            <p>Thank you for reaching out to us! 🎉</p>
            <p>We have successfully received your inquiry and our team will contact you shortly.</p>
            <p><b>City:</b> ${city || "-"}</p>
            <p><b>Country:</b> ${country || "-"}</p>
            <br>
            <p><strong>What happens next?</strong></p>
            <ul>
              <li>Our counsellor will review your details</li>
              <li>We will call you within 24-48 hours</li>
            </ul>

            <br>
            <p>
              Best regards,<br>
              <strong>Edu-hawk World</strong><br>
              📍 Delhi, India<br>
              ✉️ admin@eduhawk.in<br>
              📞 +91 9630736070
            </p>
            
            <hr>
            <small>This is an automated email. Please do not reply to this address.</small>
          </div>
        `,
      });
      console.log(`📧 Thank you email sent to ${email}`);
    } catch (err) {
      console.error("❌ Thank you mail failed:", err.message);
    }

    // Always return success
    res.status(201).json({
      success: true,
      message: "Form submitted successfully! Thank you email sent.",
      data: newQuery,
    });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get All Queries
const GetAllQueries = async (req, res) => {
  try {
    const queries = await Contact.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: queries.length,
      data: queries,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch queries",
    });
  }
};

// Delete Query
const DeleteQuery = async (req, res) => {
  try {
    const deletedQuery = await Contact.findByIdAndDelete(req.params.id);

    if (!deletedQuery) {
      return res.status(404).json({
        success: false,
        message: "Query not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Query deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Delete failed",
    });
  }
};

module.exports = {
  Createquery,
  GetAllQueries,
  DeleteQuery,
};
