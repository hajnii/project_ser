const express = require("express");
const auth = require("../middleware/auth");
const {
  createUser,
  loginUser,
  logout,
  changeMyPass,
  Mypage,
  deleteUser,
  resetPasswd,
  checkId,
  checkNickName,
  changeMyNik,
} = require("../controllers/users");

const router = express.Router();
//주석

router.route("/").post(createUser).delete(auth, deleteUser);
router.route("/login").post(loginUser);
router.route("/logout").delete(auth, logout);
router.route("/changeMyPass").post(auth, changeMyPass);
router.route("/changeMyNik").post(auth, changeMyNik);
router.route("/Mypage").get(auth, Mypage);

router.route("/resetPasswd").post(resetPasswd);

router.route("/checkid").post(checkId);
router.route("/checknik").post(checkNickName);

module.exports = router;
