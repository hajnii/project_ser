const express = require("express");
const auth = require("../middleware/auth");
const {
  createUser,
  loginUser,
  logout,
  changePasswd,
  searchPasswd,
  Mypage,
  deleteUser,
  forgotPasswd,
  resetPasswd,
} = require("../controllers/users");

const router = express.Router();

router.route("/").post(createUser);
router.route("/login").post(loginUser);
router.route("/logout").delete(auth, logout);
router.route("/changePasswd").post(auth, changePasswd);
router.route("/Mypage").get(auth, Mypage);
router.route("/").delete(auth, deleteUser);
router.route("/forgot").post(auth, forgotPasswd);
router.route("/resetPasswd/:resetPasswdToken").post(auth, resetPasswd);
module.exports = router;
