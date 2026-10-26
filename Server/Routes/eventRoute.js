const router = require("express").Router();
const {
  getEventCategories,
  getEvents,
  getEvent,
} = require("../controller/admin/eventController");

router.get("/event-categories", getEventCategories);
router.get("/events", getEvents);
router.get("/events/:id", getEvent);

module.exports = router;
