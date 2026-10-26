const User = require("../../module/authmodule/authmodule");
const getImageKit = require("../../utils/imagekit");

const MAX_PROFILE_PHOTO_SIZE = 5 * 1024 * 1024;
const PROFILE_PHOTO_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const getProfilePhoto = (req) => {
  const candidate = req.files?.photo;
  return Array.isArray(candidate) ? candidate[0] : candidate;
};

const matchesImageType = (buffer, mimeType) => {
  if (!Buffer.isBuffer(buffer)) return false;
  if (mimeType === "image/jpeg") return buffer[0] === 0xff && buffer[1] === 0xd8;
  if (mimeType === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mimeType === "image/webp") {
    return buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP";
  }
  return false;
};

const cleanupUploadedPhoto = async (fileId) => {
  if (!fileId) return;
  try {
    await getImageKit().deleteFile(fileId);
  } catch (error) {
    console.error("Could not clean up an unassigned admin profile photo:", error.message);
  }
};

const updateProfile = async (req, res) => {
  const username = String(req.body.username || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const photo = getProfilePhoto(req);

  if (username.length < 2 || username.length > 80) {
    return res.status(400).json({
      success: false,
      message: "Name must be between 2 and 80 characters",
    });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return res.status(400).json({ success: false, message: "Enter a valid email address" });
  }
  if (photo && !PROFILE_PHOTO_TYPES[photo.mimetype]) {
    return res.status(400).json({
      success: false,
      message: "Profile photo must be a JPEG, PNG or WebP image",
    });
  }
  if (photo && !matchesImageType(photo.data, photo.mimetype)) {
    return res.status(400).json({
      success: false,
      message: "The selected file is not a valid JPEG, PNG or WebP image",
    });
  }
  if (photo && photo.size > MAX_PROFILE_PHOTO_SIZE) {
    return res.status(400).json({
      success: false,
      message: "Profile photo must be 5 MB or smaller",
    });
  }

  let uploadedFileId;
  try {
    const user = await User.findById(req.userId).select("+profilePhotoFileId");
    if (!user) {
      return res.status(404).json({ success: false, message: "Admin account not found" });
    }

    const duplicate = await User.findOne({
      _id: { $ne: user._id },
      $or: [{ username }, { email }],
    }).select("username email");
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: duplicate.email === email
          ? "This email is already in use"
          : "This username is already in use",
      });
    }

    const previousPhotoFileId = user.profilePhotoFileId;
    let profilePhotoUrl = user.profilePhotoUrl;
    if (photo) {
      const extension = PROFILE_PHOTO_TYPES[photo.mimetype];
      const uploaded = await getImageKit().upload({
        file: photo.data,
        fileName: `admin-${user._id}-${Date.now()}.${extension}`,
        useUniqueFileName: true,
        folder: "/kala-mandir/profile-photos",
      });
      if (!uploaded.fileId || !uploaded.url) {
        throw new Error("ImageKit did not return the profile photo details");
      }
      uploadedFileId = uploaded.fileId;
      profilePhotoUrl = uploaded.url;
      user.profilePhotoFileId = uploaded.fileId;
    }

    user.username = username;
    user.email = email;
    user.profilePhotoUrl = profilePhotoUrl;
    await user.save();

    if (photo && previousPhotoFileId) {
      try {
        await getImageKit().deleteFile(previousPhotoFileId);
      } catch (error) {
        console.error("Could not delete the previous admin profile photo:", error.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          profilePhotoUrl: user.profilePhotoUrl,
        },
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      await cleanupUploadedPhoto(uploadedFileId);
      const field = Object.keys(error.keyPattern || {})[0];
      return res.status(409).json({
        success: false,
        message: field === "email"
          ? "This email is already in use"
          : "This username is already in use",
      });
    }

    await cleanupUploadedPhoto(uploadedFileId);

    console.error("Admin profile update failed:", error);
    return res.status(500).json({
      success: false,
      message: error.code === "IMAGEKIT_CONFIG_MISSING"
        ? "Profile photo uploads are not configured on the server"
        : "Could not update the profile. Please try again.",
    });
  }
};

module.exports = { updateProfile };
