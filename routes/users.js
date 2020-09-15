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
  checkId,
<<<<<<< HEAD
  checkNickName,
=======
  checkNickName
>>>>>>> d1c5c949542f17c463d5420e8e782175a5d3ca4d
} = require("../controllers/users");

const router = express.Router();
//주석

router.route("/").post(createUser).delete(auth, deleteUser);
router.route("/login").post(loginUser);
router.route("/logout").delete(auth, logout);
router.route("/changePasswd").post(auth, changePasswd);
router.route("/Mypage").get(auth, Mypage);

router.route("/forgot").post(auth, forgotPasswd);
router.route("/resetPasswd/:resetPasswdToken").post(auth, resetPasswd);

router.route("/checkid").post(checkId);
router.route("/checknik").post(checkNickName);

module.exports = router;
