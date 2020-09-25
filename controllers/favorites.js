// 데이터베이스 처리 위한 라이브러리 필요
const connection = require("../db/mysql_connection");
const { off } = require("../db/mysql_connection");

// @desc   스크랩 할 게시글 추가
// @route   POST /api/v1/favorites
// @parameters  board_id

exports.addFavorite = async (req, res, next) => {
  // 즐겨찾기에 이미 추가된 게시글은, 즐겨찾기에 추가되지 않도록 한다.

  let board_id = req.body.board_id;
  let user_id = req.user.id;

  let query = `insert into scrap_board (board_id, user_id) values (${board_id},${user_id})`;
  let bqur = `select * from p_board where board_id = ${board_id}`;
  console.log(query);
  try {
    [result] = await connection.query(query);
    [rows] = await connection.query(bqur);
    res.status(200).json({ success: true, items: rows });
  } catch (e) {
    if (e.errno == 1062) {
      res.status(500).json({ message: "이미 즐겨찾기에 추가되었습니다." });
    } else {
      res.status(500).json({ error: e });
    }
  }

  let question_id = req.body.question_id;
  let query = `insert into scrap_board (question_id, user_id) values (${question_id},${user_id})`;
  let qqur = `select * from p_board where question_id = ${question_id}`;
  try {
    [result] = await connection.query(query);
    [rows] = await connection.query(qqur);
    res.status(200).json({ success: true, items: rows });
  } catch (e) {
    if (e.errno == 1062) {
      res.status(500).json({ message: "이미 즐겨찾기에 추가되었습니다." });
    } else {
      res.status(500).json({ error: e });
    }
  }
};

// @desc    즐겨찾기 저장된 게시글 가져오는 API
// @route   GET /api/v1/favorites?offset=0&limit=25
// @request  offset, limit
exports.getMyFavorites = async (req, res, next) => {
  let offset = Number(req.query.offset);
  let limit = Number(req.query.limit);
  let user_id = req.user.id;

  let query = `select *,(select count(board_id) from p_comment where board_id = sb.board_id) as comment_cnt
  from scrap_board sb where user_id = ${user_id}`;

  try {
    [rows] = await connection.query(query);
    let cnt = rows.length;
    res.status(200).json({ success: true, items: rows, cnt: cnt });
  } catch (e) {
    res.status(500).json({ error: e });
  }
};

// @desc    즐겨찾기 삭제
// @route   DELETE  /api/v1/favorites
// @request  board_id, user_id(auth)

exports.deleteFavorite = async (req, res, next) => {
  let board_id = req.body.board_id;
  let user_id = req.user.id;

  let query = `delete from scrap_board where user_id = ${user_id} and board_id = ${board_id}`;

  try {
    [result] = await connection.query(query);
    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json();
  }
};
