// const router = require("express").Router();
// const {
//   Createquery,
//   GetAllQueries,
//   DeleteQuery
// } = require("../../controller/contactcontroller/querycontroller");

// router.post("/create", Createquery);
// router.get("/all", GetAllQueries);
// router.delete("/delete/:id", DeleteQuery);

// module.exports = router;


const router = require("express").Router();

const {
  Createquery,
  GetAllQueries,
  DeleteQuery,
} = require("../../controller/contactcontroller/querycontroller");

router.post("/create", Createquery);
router.get("/all", GetAllQueries);
router.delete("/delete/:id", DeleteQuery);

module.exports = router;