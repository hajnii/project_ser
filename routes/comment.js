const express = require("express");
const auth = require("../middleware/auth");
const {
  addComment,
  updateComment,
  deleteComment,
  getCommentlist,
} = require("../controllers/comment");

const router = express.Router();

// 각 경로별로 데이터 가져올 수 있도록, router 셋팅
router.route("/").post(getCommentlist);
router.route("/add").post(auth, addComment);
router.route("/update").post(auth, updateComment);
router.route("/delete").delete(auth, deleteComment);

// w질문게시판

module.exports = router;
