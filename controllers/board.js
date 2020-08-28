const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const moment = require("moment");

const connection = require("../db/mysql_connection");
const { query } = require("express");

// @desc 게시글 업로드 하는 API
// @route POST /api/v1/user/photo
// @request photo, comment, user_id(auth)
// @response success

exports.BoardUpload = async (req, res, next) => {
  let user_id = req.user.id;
  let title = req.body.title;
  let content = req.body.content;
  let category = req.body.category;

  if (!user_id || !title || !content || !category) {
    res.status(400).json({ message: "hi" });
    return;
  }

  console.log(req.body);

  let query = `insert into p_board (title, content , category , user_id) values (
        "${title}", "${content}","${category}",${user_id})`;
  console.log(query);
  try {
    [result] = await connection.query(query);
  } catch (e) {
    res.status(500).json({ success: false, message: "여기인가?" });
    return;
  }

  query = `select * from p_board where user_id = ${user_id} order by created_at desc limit 1`;
  console.log(query);

  try {
    [data] = await connection.query(query);
    res.status(200).json({ data: data });
    return;
  } catch (e) {
    res.status(500).json();
    return;
  }
};
// @desc 게시글 가져오기(25개씩)
// @route GET /api/v1/board

exports.getBoardlist = async (req, res, next) => {
  let offset = req.query.offset;
  let limit = req.query.limit;

  if (!offset || !limit) {
    res.status(400).json({ message: "파라미터가 잘 못 되었습니다." });
  }

  let query = `select * from p_board order by created_at desc limit ${offset}, ${limit}`;
  console.log(query);

  try {
    [rows] = await connection.query(query);
    let created_at = rows[0].created_at;
    let mili_movieTime = new Date(created_at).getTime;

    rows = rows.map(function (row) {
      return Object.assign({}, row, {
        created_date: moment(row.created_date).format("YYYY-MM-DD HH:mm:ss"),
      });
    });

    res.status(200).json({
      success: true,
      items: rows,
      cnt: rows.length,
      mili_movieTime: mili_movieTime,
    });
  } catch (e) {
    res.status(400).json({ success: false });
  }
};

// @desc    내가 쓴 게시글 수정
// @route   POST /api/v1/board
// @request board_id, user_id, title, content, category

exports.updateBoard = async (req, res, next) => {
  let user_id = req.user.id;
  let board_id = req.body.board_id;
  let title = req.body.title;
  let content = req.body.content;
  let category = req.body.category;

  let query = `select * from p_board where board_id = ${board_id}`;
  try {
    [rows] = await connection.query(query);
    if (rows[0].user_id != user_id) {
      res.status(401).json({ message: "자신의 아이디가 아닙니다." });
      return;
    }
  } catch (e) {
    res.status(500).json({ message: " g항 ㅇㄱ?" });
    return;
  }

  query = `update p_board set content = "${content}" , title = "${title}", category = "${category}" where board_id = ${board_id}`;
  console.log(query);

  try {
    [result] = await connection.query(query);
    res
      .status(200)
      .json({ success: true, message: "수정되었습니다.", result: result });
  } catch (e) {
    res.status(500).json({ success: false, error: e });
    return;
  }
};

// @desc    나의 게시글 삭제하기
// @route   Delete /api/v1/board
// @request board_id,  user_id

exports.deleteBoard = async (req, res, next) => {
  let user_id = req.user.id;
  let board_id = req.body.board_id;

  // 해당 유저의 댓글이 맞는지 체크
  let query = `select * from p_board where board_id = ${board_id}`;

  try {
    [rows] = await connection.query(query);
    if (rows[0].user_id != user_id) {
      res.status(401).json({ message: "자신의 아이디가 아닙니다." });
      return;
    }
  } catch (e) {
    res.status(500).json({ message: " g항 ㅇㄱ?" });
    return;
  }

  query = `delete from p_board where board_id = ${board_id}`;

  try {
    [result] = await connection.query(query);
    res.status(200).json({ success: true, message: "삭제되었습니다" });
    return;
  } catch (e) {
    res.status(500).json();
    return;
  }
};

// @desc    게시글 상세보기
// @route   POST /api/v1/board
// @request board_id,  user_id
exports.viewBoard = async (req, res, next) => {
  // console.log(req);
  let user_id = req.user.id;
  let board_id = req.body.board_id;

  let query = `
                insert into p_boardview(board_id, user_id, boardview) 
                values(${board_id}, ${user_id}, now())
                ON DUPLICATE KEY UPDATE boardview = now(); 
              `;

  try {
    [data] = await connection.query(query);
  } catch (e) {
    console.log(e);
    res.status(500).json();
    return;
  }

  query = `select *,(select count(*) from p_boardview where board_id = ${board_id}) as view_cnt from p_board where board_id = ${board_id} limit 1`;
  console.log(query);

  try {
    [data] = await connection.query(query);
    res.status(200).json({ data: data });
    return;
  } catch (e) {
    res.status(500).json();
    return;
  }
};

// 누를때마다 조회수 +1
// exports.viewBoard = async (req, res, next) => {
// // console.log(req);
// let user_id = req.user.id;
// let board_id = req.body.board_id;

// let query = `
//               insert into p_boardview(board_id, user_id, boardview) values(${board_id}, ${user_id}, now())
//             `

// try {
//   [data] = await connection.query(query);
// } catch (e) {
//   res.status(500).json();
//   return;
// }

// query = `select *,(select count(id) from p_boardview where board_id = ${board_id}) as view_cnt from p_board where board_id = ${board_id} limit 1`;
// console.log(query);

// try {
//   [data] = await connection.query(query);
//   res.status(200).json({ data : data });
//   return;
// } catch (e) {
//   res.status(500).json();
//   return;
// }
// }

// @desc      검색하는 API
// @route     GET/api/v1/board/search?keyword=Y&offset=0&limit=25
// @request   keyword,offset,limit
// @response  title

exports.searchBoard = async (req, res, next) => {
  let offset = req.query.offset;
  let limit = req.query.limit;
  let categorykey = req.body.categorykey;
  let keyword = req.query.keyword;
  let query = `
            select * from p_board WHERE category = '${categorykey}'
            and (title LIKE '%${keyword}%' or content LIKE '%${keyword}%') limit ${offset}, ${limit}
            `;
  console.log(query);
  try {
    [rows, fields] = await connection.query(query);
    res.status(200).json({ success: true, items: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: "DB Error", error: e });
  }
};
