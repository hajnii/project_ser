const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const moment = require("moment");

const connection = require("../db/mysql_connection");
const { query } = require("express");

// 내가 쓴 글 가져오기
exports.myWrite = async (req, res, next) => {
  let user_id = req.user.id;
  let order = req.query.order;

  // 해당 유저의 게시글이 맞는지 체크
  let query = `select * from p_user where id = ${user_id}`;

  try {
    [rows] = await connection.query(query);
    if (rows[0].user_id == user_id) {
      console.log("@@@@@@@@@@", rows[0].user_id);
      res.status(401).json({ seccess: false });
      return;
    }
  } catch (e) {
    res.status(500).json({ message: "위치 확인", error: e });
    return;
  }

  query = `
                select 'board' as type,board_id,null as question_id,title,b.category,content,b.created_at,u.nickname,u.email,b.user_id,(select count(*) from p_boardview where board_id = b.board_id) as view_cnt,(select count(*) from p_comment where board_id = b.board_id) as com_cnt,b.starttime,b.endtime
                from p_board b join p_user u on b.user_id = u.id where user_id = ${user_id}
                union
                select 'question' as type, null as board_id,question_id as board_id,title,q.category,content,q.created_at, u.nickname,u.email,q.user_id,(select count(*) from p_boardview where question_id =q. question_id) as view_cnt,(select count(*) from p_comment where question_id = q. question_id) as com_cnt,null as starttime,null asendtime
                from p_question q join p_user u on q.user_id = u.id where user_id = ${user_id} order by created_at ${order}
              `;
  console.log(query);
  try {
    [rows, fields] = await connection.query(query);
    res.status(200).json({ success: true, items: rows, cnt: rows.length });
  } catch (e) {
    res.status(500).json({ success: false, message: "DB Error", error: e });
  }
};

// 나의 즐겨찾기 불러오기
exports.mylikeBoard = async (req, res, next) => {
  let user_id = req.user.id;

  let query = `
                select 'board' as type,board_id,null as question_id,title,b.category,content,b.created_at,u.nickname,u.email,b.user_id,(select count(*) from p_boardview where board_id = b.board_id) as view_cnt,(select count(*) from p_comment where board_id = b.board_id) as com_cnt,b.starttime,b.endtime
                from p_board b join p_user u on b.user_id = u.id where b.board_id in (select board_id from scrap_board where user_id = ${user_id} and board_id != 0)
                union
                select 'question' as type, null as board_id,question_id as board_id,title,q.category,content,q.created_at, u.nickname,u.email,q.user_id,(select count(*) from p_boardview where question_id =q. question_id) as view_cnt,(select count(*) from p_comment where question_id = q. question_id) as com_cnt,null as starttime,null asendtime
                from p_question q join p_user u on q.user_id = u.id where q.question_id in (select question_id from scrap_board where user_id = ${user_id} and question_id != 0)`;

  try {
    [rows] = await connection.query(query);
    res.status(200).json({
      success: true,
      items: rows,
      cnt: rows.length,
    });
  } catch (e) {
    res.status(400).json({ success: false });
  }
};

// 내가 쓴 댓글 불러오기

exports.getMycomment = async (req, res, next) => {
  let user_id = req.user.id;

  let query = `
                select 'board' as type,board_id,null as question_id,title,b.category,content,b.created_at,u.nickname,u.email,b.user_id,(select count(*) from p_boardview where board_id = b.board_id) as view_cnt,(select count(*) from p_comment where board_id = b.board_id) as com_cnt,b.starttime,b.endtime
                from p_board b join p_user u on b.user_id = u.id where b.board_id in (select board_id from p_comment where user_id = ${user_id} and board_id is not null group by board_id)
                union
                select 'question' as type, null as board_id,question_id as board_id,title,q.category,content,q.created_at, u.nickname,u.email,q.user_id,(select count(*) from p_boardview where question_id =q. question_id) as view_cnt,(select count(*) from p_comment where question_id = q. question_id) as com_cnt,null as starttime,null asendtime
                from p_question q join p_user u on q.user_id = u.id where q.question_id in (select question_id from p_comment where user_id = ${user_id} and question_id is not null group by question_id)`;

  try {
    [rows] = await connection.query(query);
    res.status(200).json({
      success: true,
      items: rows,
      cnt: rows.length,
    });
  } catch (e) {
    res.status(400).json({ success: false });
  }
};
