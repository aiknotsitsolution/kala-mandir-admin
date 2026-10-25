const router = require("express").Router();
const {
  createContent,
  getHomeData,
  updateHomeData,
  deletedContent,
  getSingleContent,
} = require("../../controller/Homecontroller/homecontroller");

router.post("/create", createContent);
router.get("/product", getHomeData);
router.get("/users", getHomeData);
// router.get("/product/:slug", getSingleContent);

// routes/productRoutes.js
// router.get("/blog/:slug", getSingleContent);        // ← Change from :id to :slug
// router.put("/blog/:id", updateHomeData);            // Keep :id for update/delete
// router.delete("/blog/:id", deletedContent);

router.get("/blog/:slug", getSingleContent); // Product detail endpoint alias
router.get("/blog/:slug", getSingleContent); // Product detail endpoint
router.delete("/product/:id", deletedContent);
router.put("/updatehome/:id", updateHomeData);

module.exports = router;
