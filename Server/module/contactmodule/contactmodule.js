// // import mongoose from "mongoose";
// const mongoose = require("mongoose");
// const contactSchema = new mongoose.Schema(
//   {
//     usernamee: { type: String, required: true },
//     email: { type: String, required: true },
//     phone: { type: String, required: true },
//     subject:enum:[CorprateEvent,wedding,exibition,confrence]
//     message: { type: String, required: true },
//   },
//   { timestamps: true },
// );

// module.exports = mongoose.model("Contact", contactSchema);

// const mongoose = require("mongoose");

// const contactSchema = new mongoose.Schema(
//   {
//     username: {
//       type: String,
//       required: [true, "Name is required"],
//       trim: true,
//       minlength: [2, "Name must be at least 2 characters"]
//     },

//     email: {
//       type: String,
//       required: [true, "Email is required"],
//       trim: true,
//       lowercase: true,
//       match: [
//         /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
//         "Please enter a valid email address"
//       ]
//     },

//     phone: {
//       type: String,
//       required: [true, "Phone number is required"],
//       trim: true,
//       match: [
//         /^[0-9]{10,15}$/,
//         "Phone number must be 10–15 digits"
//       ]
//     },

//     subject: {
//       type: String,
//       required: [true, "Please select a subject"],
//       enum: {
//         values: ["CorporateEvent", "Wedding", "Exhibition", "Conference"],
//         message: "{VALUE} is not a valid subject"
//       },
//       trim: true
//     },

//     message: {
//       type: String,
//       required: [true, "Message is required"],
//       trim: true,
//       minlength: [10, "Message should be at least 10 characters long"]
//     },
//   },
//   {
//     timestamps: true
//   }
// );

// // Optional: better name in collection (lowercase + plural is convention)
// module.exports = mongoose.model("Contact", contactSchema);
// // or more explicit:
// // module.exports = mongoose.model("Contact", contactSchema, "contacts");

const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email"],
    },
    phone: {
      type: String,
      // You can make phone optional if you want
      trim: true,
      match: [/^[0-9+\s-]{7,15}$/, "Invalid phone number format"],
    },
    subject: {
      type: String,
      // required: [true, "Subject is required"],
      trim: true,
      minlength: [2, "Subject must be at least 2 characters"],
      default: "Other",
    },
    country: {
      type: String,
      trim: true,
      default: "",
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      minlength: [5, "Message must be at least 10 characters"],
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Contact", contactSchema);
