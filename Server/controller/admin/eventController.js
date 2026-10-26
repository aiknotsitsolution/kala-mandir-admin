const mongoose = require("mongoose");
const EventCategory = require("../../module/EventModule/eventCategoryModule");
const Event = require("../../module/EventModule/eventModule");
const {
  uploadAsset,
  removeAsset,
  getUploadFailure,
  getDeleteFailure,
  sanitizeProviderError,
} = require("./mediaController");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const findDuplicateCategory = (name, excludeId) =>
  EventCategory.findOne({
    name: new RegExp(`^${escapeRegex(name.trim())}$`, "i"),
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  });

const getEventCategories = async (_req, res) => {
  try {
    const categories = await EventCategory.find().sort({ name: 1 });
    return res.json({ success: true, data: categories });
  } catch (error) {
    console.error("Error fetching event categories:", error);
    return res.status(500).json({ success: false, message: "Could not fetch event categories" });
  }
};

const createEventCategory = async (req, res) => {
  const name = String(req.body.name || "").trim();
  if (!name) return res.status(400).json({ success: false, message: "Category name is required" });
  try {
    if (await findDuplicateCategory(name)) {
      return res.status(409).json({ success: false, message: "An event category with this name already exists" });
    }
    const category = await EventCategory.create({ name });
    return res.status(201).json({ success: true, data: category });
  } catch (error) {
    console.error("Error creating event category:", error);
    return res.status(500).json({ success: false, message: "Could not create event category" });
  }
};

const updateEventCategory = async (req, res) => {
  const name = String(req.body.name || "").trim();
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid event category id" });
  }
  if (!name) return res.status(400).json({ success: false, message: "Category name is required" });
  try {
    const category = await EventCategory.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: "Event category not found" });
    if (await findDuplicateCategory(name, category._id)) {
      return res.status(409).json({ success: false, message: "An event category with this name already exists" });
    }
    category.name = name;
    await category.save();
    return res.json({ success: true, data: category });
  } catch (error) {
    console.error("Error updating event category:", error);
    return res.status(500).json({ success: false, message: "Could not update event category" });
  }
};

const deleteEventCategory = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid event category id" });
  }
  try {
    if (await Event.exists({ categoryId: req.params.id })) {
      return res.status(409).json({
        success: false,
        message: "Move or delete this category's events before deleting it",
      });
    }
    const category = await EventCategory.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: "Event category not found" });
    return res.json({ success: true, message: "Event category deleted" });
  } catch (error) {
    console.error("Error deleting event category:", error);
    return res.status(500).json({ success: false, message: "Could not delete event category" });
  }
};

const getEvents = async (_req, res) => {
  try {
    const events = await Event.find()
      .select("title description categoryId type url thumbnailUrl createdAt")
      .populate("categoryId", "name")
      .sort({ createdAt: -1 });
    return res.json({ success: true, data: events });
  } catch (error) {
    console.error("Error fetching events:", error);
    return res.status(500).json({ success: false, message: "Could not fetch events" });
  }
};

const getEvent = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid event id" });
  }
  try {
    const event = await Event.findById(req.params.id)
      .select("title description categoryId type url thumbnailUrl createdAt")
      .populate("categoryId", "name");
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
    return res.json({ success: true, data: event });
  } catch (error) {
    console.error("Error fetching event:", error);
    return res.status(500).json({ success: false, message: "Could not fetch event" });
  }
};

const validateEvent = async ({ title, description, categoryId, type }) => {
  if (!title?.trim()) return { error: "Event title is required" };
  if (!description?.trim()) return { error: "Event description is required" };
  if (!["photo", "video"].includes(type)) return { error: "Media type must be photo or video" };
  if (!mongoose.isValidObjectId(categoryId)) return { error: "Please select an event category" };
  const category = await EventCategory.findById(categoryId);
  if (!category) return { error: "Selected event category was not found" };
  return { category };
};

const createEvent = async (req, res) => {
  let asset;
  try {
    const details = {
      title: req.body.title,
      description: req.body.description,
      categoryId: req.body.categoryId,
      type: req.body.type,
    };
    const validation = await validateEvent(details);
    if (validation.error) return res.status(400).json({ success: false, message: validation.error });
    asset = await uploadAsset(
      req.files?.file && (Array.isArray(req.files.file) ? req.files.file[0] : req.files.file),
      details.type,
    );
    const event = await Event.create({
      ...details,
      title: details.title.trim(),
      description: details.description.trim(),
      ...asset,
    });
    return res.status(201).json({ success: true, data: event });
  } catch (error) {
    console.error("Error creating event:", {
      provider: req.body.type === "photo" ? "ImageKit" : "Cloudinary",
      httpCode: error.http_code || error.statusCode,
      error: sanitizeProviderError(error),
    });
    if (asset) {
      try {
        await removeAsset(asset);
      } catch (cleanupError) {
        console.error("Could not clean up uploaded event asset:", sanitizeProviderError(cleanupError));
      }
    }
    const failure = getUploadFailure(error, req.body.type, "create");
    return res.status(failure.status).json({ success: false, message: failure.message });
  }
};

const updateEvent = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid event id" });
  }
  let newAsset;
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
    const details = {
      title: req.body.title,
      description: req.body.description,
      categoryId: req.body.categoryId,
      type: req.body.type,
    };
    const validation = await validateEvent(details);
    if (validation.error) return res.status(400).json({ success: false, message: validation.error });
    const file = req.files?.file && (Array.isArray(req.files.file) ? req.files.file[0] : req.files.file);
    if (file) newAsset = await uploadAsset(file, details.type);
    if (event.type !== details.type && !file) {
      return res.status(400).json({
        success: false,
        message: "Select a new file when changing the event media type",
      });
    }

    const oldAsset = {
      provider: event.provider,
      providerFileId: event.providerFileId,
      providerResourceType: event.providerResourceType,
      type: event.type,
    };
    Object.assign(event, {
      ...details,
      title: details.title.trim(),
      description: details.description.trim(),
      ...(newAsset || {}),
    });
    await event.save();
    if (newAsset) {
      try {
        await removeAsset(oldAsset);
      } catch (cleanupError) {
        console.error("Could not remove replaced event asset:", sanitizeProviderError(cleanupError));
      }
    }
    return res.json({ success: true, data: event });
  } catch (error) {
    console.error("Error updating event:", {
      provider: req.body.type === "photo" ? "ImageKit" : "Cloudinary",
      httpCode: error.http_code || error.statusCode,
      error: sanitizeProviderError(error),
    });
    if (newAsset) {
      try {
        await removeAsset(newAsset);
      } catch (cleanupError) {
        console.error("Could not clean up replacement event asset:", sanitizeProviderError(cleanupError));
      }
    }
    const failure = getUploadFailure(error, req.body.type, "update");
    return res.status(failure.status).json({ success: false, message: failure.message });
  }
};

const deleteEvent = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid event id" });
  }
  let provider = "";
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
    provider = event.provider;
    await removeAsset(event);
    await event.deleteOne();
    return res.json({ success: true, message: "Event deleted" });
  } catch (error) {
    console.error("Error deleting event:", {
      provider: provider || "Unknown",
      httpCode: error.http_code || error.statusCode,
      error: sanitizeProviderError(error),
    });
    const failure = getDeleteFailure(error, provider);
    return res.status(failure.status).json({ success: false, message: failure.message });
  }
};

module.exports = {
  getEventCategories,
  createEventCategory,
  updateEventCategory,
  deleteEventCategory,
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
};
