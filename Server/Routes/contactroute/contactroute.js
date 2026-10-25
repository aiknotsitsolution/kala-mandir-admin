const router = require("express").Router();
const {
  createContactMessage,
  getContactMessages,
  deleteContactMessage,
} = require("../../controller/contactcontroller/contactcontroler");

router.post("/create", createContactMessage);
router.get("/", getContactMessages);
router.delete("/:id", deleteContactMessage);

module.exports = router;
