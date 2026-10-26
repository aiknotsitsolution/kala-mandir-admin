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
const {
  getEventCategories,
  getEvents,
  createEventCategory,
  updateEventCategory,
  deleteEventCategory,
  createEvent,
  updateEvent,
  deleteEvent,
} = require("../controller/admin/eventController");
const {
  getContactMessages,
  deleteContactMessage,
} = require("../controller/contactcontroller/contactcontroler");
const { updateProfile } = require("../controller/admin/profileController");

router.use(requireAuth);

router.put("/profile", updateProfile);
router.get("/categories", getAllCategories);
router.post("/categories", createCategory);
router.put("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);

router.get("/media", getAllMedia);
router.post("/media", createMedia);
router.put("/media/:id", updateMedia);
router.delete("/media/:id", deleteMedia);

router.get("/event-categories", getEventCategories);
router.post("/event-categories", createEventCategory);
router.put("/event-categories/:id", updateEventCategory);
router.delete("/event-categories/:id", deleteEventCategory);

router.get("/events", getEvents);
router.post("/events", createEvent);
router.put("/events/:id", updateEvent);
router.delete("/events/:id", deleteEvent);

router.get("/enquiries", getContactMessages);
router.delete("/enquiries/:id", deleteContactMessage);

module.exports = router;
