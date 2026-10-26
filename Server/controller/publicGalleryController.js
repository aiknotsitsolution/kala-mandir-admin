const mongoose = require("mongoose");
const Category = require("../module/BlogModule/caetgorymodule");
const Media = require("../module/GalleryModule/mediaModule");

const getPublicGalleryCategories = async (_req, res) => {
  try {
    const categories = await Category.find()
      .select("name subcategories")
      .sort({ name: 1 })
      .lean();
    return res.json({ success: true, data: categories });
  } catch (error) {
    console.error("Error fetching public gallery categories:", error);
    return res.status(500).json({
      success: false,
      message: "Could not load gallery categories",
    });
  }
};

const getPublicGalleryMedia = async (req, res) => {
  const { categoryId, subcategory } = req.query;
  if (categoryId && !mongoose.isValidObjectId(categoryId)) {
    return res.status(400).json({ success: false, message: "Invalid gallery category" });
  }
  if (subcategory && String(subcategory).length > 100) {
    return res.status(400).json({ success: false, message: "Invalid gallery subcategory" });
  }

  const filter = {};
  if (categoryId) filter.categoryId = categoryId;
  if (subcategory && subcategory !== "__all__") filter.subcategory = subcategory;

  try {
    const media = await Media.find(filter)
      .select("title type categoryId subcategory url thumbnailUrl createdAt")
      .populate("categoryId", "name")
      .sort({ createdAt: -1 })
      .lean();
    const data = media.map((item) => ({
      id: String(item._id),
      title: item.title,
      type: item.type,
      categoryId: item.categoryId?._id ? String(item.categoryId._id) : "",
      categoryName: item.categoryId?.name || "",
      subcategory: item.subcategory || "",
      url: item.url,
      thumbnailUrl: item.thumbnailUrl,
      createdAt: item.createdAt,
    }));
    return res.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching public gallery media:", error);
    return res.status(500).json({
      success: false,
      message: "Could not load gallery items",
    });
  }
};

module.exports = { getPublicGalleryCategories, getPublicGalleryMedia };
