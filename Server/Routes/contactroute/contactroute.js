const router = require("express").Router();
const {
  createContactMessage,
  createWebsiteEnquiry,
} = require("../../controller/contactcontroller/contactcontroler");

router.post("/create", createContactMessage);
router.post("/enquiries", createWebsiteEnquiry);

module.exports = router;
