const express = require("express");
const auth = require("../middleware/auth");
const {
  sendmessage,
  mymessage,
  getmessage,
} = require("../controllers/message");

const router = express.Router();

router.route("/").put(auth, sendmessage);
router.route("/my").get(auth, mymessage);
router.route("/").get(auth, getmessage);
module.exports = router;
