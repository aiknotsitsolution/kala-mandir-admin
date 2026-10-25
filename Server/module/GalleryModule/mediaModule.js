const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: ["photo", "video"], required: true },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BlogCategory",
      required: true,
    },
    subcategory: { type: String, default: "" },
    url: { type: String, required: true },
    thumbnailUrl: { type: String, required: true },
    provider: { type: String, enum: ["imagekit", "cloudinary"], required: true },
    providerFileId: { type: String, required: true },
    providerResourceType: { type: String, enum: ["image", "video"] },
  },
  { timestamps: true },
);

module.exports = mongoose.model("GalleryMedia", mediaSchema);
