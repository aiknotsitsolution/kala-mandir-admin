const mongoose = require("mongoose");
const Category = require("../../module/BlogModule/caetgorymodule");
const Media = require("../../module/GalleryModule/mediaModule");
const cloudinary = require("../../utils/cloudinary");
const getImageKit = require("../../utils/imagekit");

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const CLOUDINARY_UPLOAD_PRESET =
  process.env.CLOUDINARY_UPLOAD_PRESET || "kala mandir";

const sanitizeProviderError = (error) =>
  String(error?.message || "Unknown provider error")
    .replace(/invalid api[_ -]?key\s+\S+/gi, "Invalid API key [redacted]")
    .replace(/api[_ -]?secret\s+\S+/gi, "API secret [redacted]");

const getUploadFailure = (error, type, operation) => {
  const errorMessage = String(error?.message || "");
  if (
    errorMessage.startsWith("Please ") ||
    errorMessage.startsWith("File size") ||
    errorMessage.startsWith("Select a new file")
  ) {
    return { status: 400, message: errorMessage };
  }
  if (error.code === "IMAGEKIT_CONFIG_MISSING") {
    return {
      status: 503,
      message: "ImageKit is not configured. Add its public key, private key, and URL endpoint to Server/.env.",
    };
  }
  if (type === "photo" && [401, 403].includes(error.statusCode || error.http_code)) {
    return {
      status: 502,
      message: "ImageKit rejected the photo upload. Check the ImageKit API keys and URL endpoint in Server/.env.",
    };
  }
  if (error.http_code === 401) {
    return {
      status: 502,
      message: "Cloudinary rejected its configured credentials. Check the Cloudinary keys in Server/.env, then restart the backend.",
    };
  }
  if (error.http_code === 403) {
    return {
      status: 502,
      message: "Cloudinary denied this unsigned upload. Confirm the upload preset exists, is set to Unsigned, and permits this file type.",
    };
  }
  if (
    error.http_code === 400 &&
    /whitelisted for unsigned uploads/i.test(error.message || "")
  ) {
    return {
      status: 502,
      message: "Cloudinary rejected the video upload preset. Enable unsigned uploads for the configured preset in Cloudinary, then retry.",
    };
  }
  return {
    status: 500,
    message: operation === "update" ? "Could not update gallery media" : "Could not upload gallery media",
  };
};

const getDeleteFailure = (error, provider) => {
  const statusCode = error.http_code || error.statusCode;
  if (error.code === "IMAGEKIT_CONFIG_MISSING") {
    return {
      status: 503,
      message: "ImageKit is not configured. Add its public key, private key, and URL endpoint to Server/.env.",
    };
  }
  if (provider === "imagekit" && statusCode === 403) {
    return {
      status: 502,
      message: "ImageKit denied file deletion. Enable file-delete permission for the private API key in Server/.env, then restart the backend and retry.",
    };
  }
  if (provider === "imagekit" && statusCode === 401) {
    return {
      status: 502,
      message: "ImageKit rejected its credentials. Check the private API key in Server/.env, then restart the backend and retry.",
    };
  }
  if (provider === "cloudinary" && statusCode === 401) {
    return {
      status: 502,
      message: "Cloudinary rejected its configured credentials. Check the Cloudinary keys in Server/.env, then restart the backend.",
    };
  }
  if (provider === "cloudinary" && statusCode === 403) {
    return {
      status: 502,
      message: "Cloudinary denied file deletion. Check the Cloudinary API key permissions and account configuration.",
    };
  }
  return { status: 500, message: "Could not delete gallery media" };
};

const getUploadedFile = (req) => {
  const candidate = req.files?.file;
  return Array.isArray(candidate) ? candidate[0] : candidate;
};

const uploadAsset = async (file, type) => {
  if (!file) throw new Error("Please select a photo or video to upload");
  if (file.size > MAX_FILE_SIZE) throw new Error("File size must be 100 MB or less");

  const expectedMimeType = type === "photo" ? "image/" : "video/";
  if (!file.mimetype.startsWith(expectedMimeType)) {
    throw new Error(`Please select a ${type === "photo" ? "photo/image" : "video"} file`);
  }
  if (type === "photo") {
    const uploaded = await getImageKit().upload({
      file: file.data,
      fileName: file.name,
      useUniqueFileName: true,
      folder: "/kala-mandir/photos",
    });
    if (!uploaded.fileId || !uploaded.url) {
      throw new Error("ImageKit did not return the uploaded photo details");
    }
    return {
      url: uploaded.url,
      thumbnailUrl: uploaded.thumbnailUrl || uploaded.url,
      provider: "imagekit",
      providerFileId: uploaded.fileId,
      providerResourceType: "image",
    };
  }

  const resourceType = "video";
  const uploaded = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.unsigned_upload_stream(
      CLOUDINARY_UPLOAD_PRESET,
      {
        resource_type: resourceType,
        timeout: 0,
      },
      (error, result) => (error ? reject(error) : resolve(result)),
    );
    stream.end(file.data);
  });
  return {
    url: uploaded.secure_url,
    thumbnailUrl:
      resourceType === "video"
        ? cloudinary.url(uploaded.public_id, {
            resource_type: "video",
            format: "jpg",
            transformation: [{ start_offset: "0" }],
            secure: true,
          })
        : uploaded.secure_url,
    provider: "cloudinary",
    providerFileId: uploaded.public_id,
    providerResourceType: resourceType,
  };
};

const removeAsset = async (media) => {
  if (media.provider === "imagekit") {
    if (!media.providerFileId) throw new Error("ImageKit file ID is missing");
    await getImageKit().deleteFile(media.providerFileId);
  } else if (media.provider === "cloudinary") {
    if (!media.providerFileId) throw new Error("Cloudinary file ID is missing");
    try {
      const result = await cloudinary.uploader.destroy(media.providerFileId, {
        resource_type:
          media.providerResourceType || (media.type === "photo" ? "image" : "video"),
        invalidate: true,
      });
      console.log("Cloudinary delete result:", result);
    } catch (error) {
      console.error("Cloudinary delete failed:", {
        status: error.http_code,
        message: sanitizeProviderError(error),
        details: sanitizeProviderError({
          message: error.error?.message || error.error || error.message,
        }),
      });
      throw error;
    }
  } else {
    throw new Error("Media provider is not supported");
  }
};

const validateMediaData = async ({ title, type, categoryId, subcategory }) => {
  if (!title?.trim()) return { error: "Title is required" };
  if (!["photo", "video"].includes(type)) return { error: "Type must be photo or video" };
  if (!mongoose.isValidObjectId(categoryId)) return { error: "Please select a category" };
  const category = await Category.findById(categoryId);
  if (!category) return { error: "Selected category was not found" };
  if (subcategory && !category.subcategories.includes(subcategory)) {
    return { error: "Selected subcategory does not belong to this category" };
  }
  return { category };
};

const getAllMedia = async (_req, res) => {
  try {
    const items = await Media.find().sort({ createdAt: -1 });
    return res.json({ success: true, data: items });
  } catch (err) {
    console.error("Error fetching gallery media:", err);
    return res.status(500).json({ success: false, message: "Could not fetch gallery media" });
  }
};

const createMedia = async (req, res) => {
  let asset;
  try {
    const details = {
      title: req.body.title,
      type: req.body.type,
      categoryId: req.body.categoryId,
      subcategory: req.body.subcategory || "",
    };
    const validation = await validateMediaData(details);
    if (validation.error) {
      return res.status(400).json({ success: false, message: validation.error });
    }
    asset = await uploadAsset(getUploadedFile(req), details.type);
    const media = await Media.create({ ...details, title: details.title.trim(), ...asset });
    return res.status(201).json({ success: true, data: media });
  } catch (err) {
    console.error("Error creating gallery media:", {
      provider: req.body.type === "photo" ? "ImageKit" : "Cloudinary",
      httpCode: err.http_code || err.statusCode,
      error: sanitizeProviderError(err),
    });
    if (asset) {
      try {
        await removeAsset(asset);
      } catch (cleanupError) {
        console.error("Could not clean up uploaded gallery asset:", {
          httpCode: cleanupError.http_code,
          error: sanitizeProviderError(cleanupError),
        });
      }
    }
    const failure = getUploadFailure(err, req.body.type, "create");
    return res.status(failure.status).json({
      success: false,
      message: failure.message,
    });
  }
};

const updateMedia = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid media id" });
  }

  let newAsset;
  try {
    const existing = await Media.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: "Media not found" });
    const details = {
      title: req.body.title,
      type: req.body.type,
      categoryId: req.body.categoryId,
      subcategory: req.body.subcategory || "",
    };
    const validation = await validateMediaData(details);
    if (validation.error) {
      return res.status(400).json({ success: false, message: validation.error });
    }
    const file = getUploadedFile(req);
    if (file) newAsset = await uploadAsset(file, details.type);
    if (existing.type !== details.type && !file) {
      return res.status(400).json({
        success: false,
        message: "Select a new file when changing the media type",
      });
    }

    const previousAsset = {
      provider: existing.provider,
      providerFileId: existing.providerFileId,
      providerResourceType: existing.providerResourceType,
      type: existing.type,
    };
    Object.assign(existing, { ...details, title: details.title.trim() }, newAsset || {});
    await existing.save();
    if (newAsset) {
      try {
        await removeAsset(previousAsset);
      } catch (cleanupError) {
        console.error("Could not remove replaced gallery asset:", {
          httpCode: cleanupError.http_code,
          error: sanitizeProviderError(cleanupError),
        });
      }
    }
    return res.json({ success: true, data: existing });
  } catch (err) {
    console.error("Error updating gallery media:", {
      provider: req.body.type === "photo" ? "ImageKit" : "Cloudinary",
      httpCode: err.http_code || err.statusCode,
      error: sanitizeProviderError(err),
    });
    if (newAsset) {
      try {
        await removeAsset(newAsset);
      } catch (cleanupError) {
        console.error("Could not clean up replacement gallery asset:", {
          httpCode: cleanupError.http_code,
          error: sanitizeProviderError(cleanupError),
        });
      }
    }
    const failure = getUploadFailure(err, req.body.type, "update");
    return res.status(failure.status).json({
      success: false,
      message: failure.message,
    });
  }
};

const deleteMedia = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid media id" });
  }
  let provider = "";
  try {
    const media = await Media.findById(req.params.id);
    if (!media) return res.status(404).json({ success: false, message: "Media not found" });
    provider = media.provider;
    await removeAsset(media);
    await media.deleteOne();
    return res.json({ success: true, message: "Media deleted" });
  } catch (err) {
    console.error("Error deleting gallery media:", {
      provider: provider || "Unknown",
      httpCode: err.http_code || err.statusCode,
      error: sanitizeProviderError(err),
    });
    const failure = getDeleteFailure(err, provider);
    return res.status(failure.status).json({
      success: false,
      message: failure.message,
    });
  }
};

module.exports = {
  createMedia,
  getAllMedia,
  updateMedia,
  deleteMedia,
  uploadAsset,
  removeAsset,
  getUploadFailure,
  getDeleteFailure,
  sanitizeProviderError,
};
