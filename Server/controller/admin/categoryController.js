const mongoose = require("mongoose");
const Category = require("../../module/BlogModule/caetgorymodule");
const Media = require("../../module/GalleryModule/mediaModule");

const normalizeSubcategories = (subcategories) => {
  if (!Array.isArray(subcategories)) return null;
  return [...new Set(subcategories.map((item) => String(item).trim()).filter(Boolean))];
};

const validateCategory = (name, type, subcategories) => {
  if (!name?.trim()) return "Category name is required";
  if (!["photo", "video"].includes(type)) return "Category type must be photo or video";
  if (!Array.isArray(subcategories)) return "Subcategories must be a list";
  return null;
};

const createCategory = async (req, res) => {
  const { name, type, subcategories } = req.body;
  const normalizedSubcategories = normalizeSubcategories(subcategories);
  const error = validateCategory(name, type, normalizedSubcategories);
  if (error) return res.status(400).json({ success: false, message: error });

  try {
    const category = await Category.create({
      name: name.trim(),
      type,
      subcategories: normalizedSubcategories,
    });
    return res.status(201).json({ success: true, data: category });
  } catch (err) {
    console.error("Error creating admin category:", err);
    return res.status(500).json({ success: false, message: "Could not create category" });
  }
};

const getAllCategories = async (_req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    return res.json({ success: true, data: categories });
  } catch (err) {
    console.error("Error fetching admin categories:", err);
    return res.status(500).json({ success: false, message: "Could not fetch categories" });
  }
};

const updateCategory = async (req, res) => {
  const { name, type, subcategories } = req.body;
  const normalizedSubcategories = normalizeSubcategories(subcategories);
  const error = validateCategory(name, type, normalizedSubcategories);
  if (error) return res.status(400).json({ success: false, message: error });
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid category id" });
  }

  try {
    const existingCategory = await Category.findById(req.params.id);
    if (!existingCategory) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }
    const assignedMedia = await Media.find({ categoryId: req.params.id })
      .select("type subcategory")
      .lean();
    const typeMismatch = assignedMedia.some((item) => item.type !== type);
    const removedSubcategories = existingCategory.subcategories.filter(
      (subcategory) => !normalizedSubcategories.includes(subcategory),
    );
    const addedSubcategories = normalizedSubcategories.filter(
      (subcategory) => !existingCategory.subcategories.includes(subcategory),
    );
    const removedSubcategoryIsUsed = assignedMedia.some(
      (item) => removedSubcategories.includes(item.subcategory),
    );
    const isSimpleRename =
      removedSubcategories.length === 1 && addedSubcategories.length === 1;

    if (
      typeMismatch ||
      (removedSubcategoryIsUsed && !isSimpleRename)
    ) {
      return res.status(409).json({
        success: false,
        message: "Update or move assigned gallery items before changing this category's type or subcategories",
      });
    }

    if (removedSubcategoryIsUsed && isSimpleRename) {
      await Media.updateMany(
        { categoryId: req.params.id, subcategory: removedSubcategories[0] },
        { $set: { subcategory: addedSubcategories[0] } },
      );
    }

    existingCategory.name = name.trim();
    existingCategory.type = type;
    existingCategory.subcategories = normalizedSubcategories;
    const category = await existingCategory.save();
    return res.json({ success: true, data: category });
  } catch (err) {
    console.error("Error updating admin category:", err);
    return res.status(500).json({ success: false, message: "Could not update category" });
  }
};

const deleteCategory = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid category id" });
  }

  try {
    const usedByMedia = await Media.exists({ categoryId: req.params.id });
    if (usedByMedia) {
      return res.status(409).json({
        success: false,
        message: "Move or delete this category's gallery items before deleting it",
      });
    }
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }
    return res.json({ success: true, message: "Category deleted" });
  } catch (err) {
    console.error("Error deleting admin category:", err);
    return res.status(500).json({ success: false, message: "Could not delete category" });
  }
};

module.exports = { createCategory, getAllCategories, updateCategory, deleteCategory };
