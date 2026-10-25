const router = require("express").Router();
const {
    createCategory,
    getAllCategories,
    deleteCategory,
    updateCategory,
} = require("../../controller/techcontroller/categorycontroller.js");

router.post("/create", createCategory);
router.put("/update/:id", updateCategory);
router.get("/", getAllCategories);
router.delete("/:id", deleteCategory);


module.exports = router;
