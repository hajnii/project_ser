const express = require("express");
const auth = require("../middleware/auth");
const {} = require("../controllers/message");
const {
  addQComment,
  updateQComment,
  getQCommentlist,
  deleteQComment,
} = require("../controllers/qcomment");

const router = express.Router();

router.route("/").post(getQCommentlist);
router.route("/add").post(auth, addQComment);
router.route("/update").post(auth, updateQComment);
router.route("/delete").delete(auth, deleteQComment);
module.exports = router;
