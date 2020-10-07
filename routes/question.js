const express = require("express");
const auth = require("../middleware/auth");
const {
  uploadQuestion,
  latestQuestion,
  viewQuestion,
  updateQuestion,
  deleteQuestion,
  qmemberBoard,
} = require("../controllers/question");
const { route } = require("./users");

const router = express.Router();

router.route("/").put(auth, uploadQuestion);
router.route("/latestQuestion").get(latestQuestion);
router.route("/view").post(auth, viewQuestion);
router.route("/update").put(auth, updateQuestion);
router.route("/delete").delete(auth, deleteQuestion);
router.route("/nomem").post(qmemberBoard);
module.exports = router;
