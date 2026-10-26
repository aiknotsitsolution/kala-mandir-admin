const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EventCategory",
      required: true,
    },
    type: { type: String, enum: ["photo", "video"], required: true },
    url: { type: String, required: true },
    thumbnailUrl: { type: String, required: true },
    provider: { type: String, enum: ["imagekit", "cloudinary"], required: true },
    providerFileId: { type: String, required: true },
    providerResourceType: { type: String, enum: ["image", "video"], required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Event", eventSchema);
