// import mongoose from "mongoose";
const mongoose = require("mongoose");
const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["photo", "video"], default: "photo" },
    subcategories: { type: [String], default: [] },
  },
  { timestamps: true },
);

module.exports = mongoose.model("BlogCategory", categorySchema);
