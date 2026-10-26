const router = require("express").Router();
const {
  getPublicGalleryCategories,
  getPublicGalleryMedia,
} = require("../controller/publicGalleryController");

router.get("/categories", getPublicGalleryCategories);
router.get("/media", getPublicGalleryMedia);

module.exports = router;
