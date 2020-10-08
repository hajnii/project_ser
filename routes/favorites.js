const express = require("express");
const auth = require("../middleware/auth");
const { deleteFavorite } = require("../controllers/favorites");
const { addFavorite } = require("../controllers/favorites");

const router = express.Router();

// 각 경로별로 데이터 가져올 수 있도록, router 셋팅
router.route("/").post(auth, addFavorite).delete(auth, deleteFavorite);

module.exports = router;
