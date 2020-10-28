const express = require("express");
const auth = require("../middleware/auth");
const { myWrite, mylikeBoard, getMycomment } = require("../controllers/mypage");
const router = express.Router();

router.route("/mywrite").post(auth, myWrite);
router.route("/mylike").get(auth, mylikeBoard);
router.route("/mycomment").get(auth, getMycomment);

module.exports = router;
