const router = require("express").Router();
const requireAuth = require("../middleware/requireAuth");
const {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
} = require("../controller/admin/categoryController");
const {
  createMedia,
  getAllMedia,
  updateMedia,
  deleteMedia,
} = require("../controller/admin/mediaController");

router.use(requireAuth);

router.get("/categories", getAllCategories);
router.post("/categories", createCategory);
router.put("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);

router.get("/media", getAllMedia);
router.post("/media", createMedia);
router.put("/media/:id", updateMedia);
router.delete("/media/:id", deleteMedia);

module.exports = router;
