const express = require("express");
const auth = require("../middleware/auth");
const {
  BoardUpload,
  getBoardlist,
  updateBoard,
  deleteBoard,
  searchBoard,
  viewBoard,
  myWrite,
} = require("../controllers/board");
const router = express.Router();

// 각 경로별로 데이터 가져올 수 있도록, router 셋팅
router.route("/").post(auth, BoardUpload).get(getBoardlist);
// router.route("/view").post(auth, viewBoard);
router.route("/view").post(auth, viewBoard);
router.route("/update").post(auth, updateBoard);
router.route("/delete").delete(auth, deleteBoard);
router.route("/search").post(searchBoard);
router.route("/mywrite").post(auth, myWrite);

module.exports = router;
