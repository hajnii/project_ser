const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const moment = require("moment");

const connection = require("../db/mysql_connection");
const { query } = require("express");

// @desc 게시글 업로드 하는 API
// @route POST /api/v1/board/
// @request user_id(auth),title,content,category,starttime,endtime
// @response success

exports.BoardUpload = async (req, res, next) => {
  let user_id = req.user.id;
  let title = req.body.title;
  let content = req.body.content;
  let category = req.body.category;
  let starttime = req.body.starttime;
  let endtime = req.body.endtime;

  if (!user_id || !title || !content || !category || !starttime || !endtime) {
    res.status(400).json({ message: "hi" });
    return;
  }

  console.log(req.body);

  let query = `insert into p_board (title, content , category ,starttime,endtime, user_id) values (
        "${title}", "${content}","${category}","${starttime}","${endtime}",${user_id})`;
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

// @desc 최신글 보여주기
// @route GET /api/v1/board
// @request order,limit
// @response success

exports.getBoardlist = async (req, res, next) => {
  let order = req.query.order;
  let limit = req.query.limit;
  let b_limit_query = "";

  if (!!limit) {
    b_limit_query = `limit ${limit}`;
  }

  let query = `select b.*,u.nickname,u.email, ifnull((select count(board_id) from p_boardview where board_id = b.board_id group by board_id),0) as view_cnt, 
              ifnull((select count(board_id) from p_comment where board_id = b.board_id group by board_id),0) as com_cnt
              from p_board as b left join p_user as u on b.user_id = u.id 
              order by created_at ${order} ${b_limit_query}`;
  console.log(query);

  try {
    [rows] = await connection.query(query);
    res.status(200).json({
      success: true,
      items: rows,
      cnt: rows.length,
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({ success: false });
  }
};

// @desc    내가 쓴 게시글 수정
// @route   POST /api/v1/board/update
// @request board_id, user_id, title, content, category, starttime,endtime

exports.updateBoard = async (req, res, next) => {
  let user_id = req.user.id;
  let board_id = req.body.board_id;
  let title = req.body.title;
  let content = req.body.content;
  let category = req.body.category;
  let starttime = req.body.starttime;
  let endtime = req.body.endtime;

  let query = `select * from p_board where board_id = ${board_id}`;
  try {
    [rows] = await connection.query(query);
    if (rows[0].user_id != user_id) {
      res.status(401).json({ message: "자신의 아이디가 아닙니다." });
      return;
    }
  } catch (e) {
    res.status(500).json({ message: " message " });
    return;
  }

  query = `update p_board set content = "${content}" , title = "${title}", category = "${category}",
  starttime = "${starttime}", endtime = "${endtime}" where board_id = ${board_id}`;
  console.log(query);

  let qur = `select u.nickname ,b.* from p_board as b
              left join p_user as u 
              on b.user_id = u.id 
              where board_id = ${board_id}`;

  try {
    [result] = await connection.query(query);
    [rows] = await connection.query(qur);
    res
      .status(200)
      .json({ success: true, message: "수정되었습니다.", items: rows });
  } catch (e) {
    res.status(500).json({ success: false, error: e });
    return;
  }
};

// @desc    나의 게시글 삭제하기
// @route   Delete /api/v1/board/delete
// @request board_id,  user_id

exports.deleteBoard = async (req, res, next) => {
  let user_id = req.user.id;
  let board_id = req.body.board_id;

  // 해당 유저의 게시글이 맞는지 체크
  let query = `select * from p_board where board_id = ${board_id}`;

  try {
    [rows] = await connection.query(query);
    if (rows[0].user_id != user_id) {
      res.status(401).json({ message: "자신의 아이디가 아닙니다." });
      return;
    }
  } catch (e) {
    res.status(500).json({ message: "위치 확인" });
    return;
  }

  let boardquery = `delete from p_board where board_id = ${board_id}`;

  try {
    [result] = await connection.query(boardquery);
    res.status(200).json({ success: true, message: "삭제되었습니다" });
    console.log(boardquery)
  } catch (e) {
    res.status(500).json();
    return;
  }
  let commentquery = `delete from p_comment where board_id =  ${board_id}`
  
  try {
    [result] = await connection.query(commentquery);
    console.log(commentquery)
    res.status(200).json({ success: true, message: "삭제되었습니다" });
    return;
  } catch (e) {
    res.status(500).json();
    return;
  }
  

};

// @desc    게시글 상세보기(로그인 채로)
// @route   POST /api/v1/board/view
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
    if (!user_id) {
      user_id = 0;
    }
    [data] = await connection.query(query);
  } catch (e) {
    console.log(e);
    res.status(500).json();
    return;
  }

  query = `select b.* , (select count(*) from p_boardview where board_id =${board_id}) as view_cnt , 
  (select count(*) from scrap_board where board_id = ${board_id} and user_id = ${user_id}) as is_favorite
  from p_board as b join p_user as u on b.user_id = u.id where board_id = ${board_id};`;

  try {
    [data] = await connection.query(query);
    res.status(200).json({ data: data });
    return;
  } catch (e) {
    res.status(500).json();
    return;
  }
};

// @desc    게시글 상세보기(비회원)
// @route   POST /api/v1/board/nomem
// @request board_id
exports.nonmemberBoard = async (req, res, next) => {
  // console.log(req);
  let board_id = req.body.board_id;

  let query = `select b.* , (select count(*) from p_boardview where board_id =${board_id}) as view_cnt , 
  (select count(*) from scrap_board where board_id = ${board_id}) as is_favorite
  from p_board as b where board_id = ${board_id};`;

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
// @route     GET/api/v1/board/search?category=Android&keyword=내용
// @request   category,keyword

exports.searchBoard = async (req, res, next) => {
  let category = req.query.category;
  let keyword = req.query.keyword;

  let b_keyword_query_where = "";
  let q_keyword_query_where = "";

  let b_category_query_where = "";
  let q_category_query_where = "";

  if (!!keyword) {
    b_keyword_query_where = `and (b.title like '%${keyword}%' or b.content like '%${keyword}%')`;
    q_keyword_query_where = `and (q.title like '%${keyword}%' or q.content like '%${keyword}%')`;
  }

  if (!!category) {
    b_category_query_where = ` and b.category = '${category}' `;
    q_category_query_where = ` and q.category = '${category}' `;
  }

  let query = `
              select 'board' as type,board_id,null as question_id,title,b.category,content,b.created_at,u.nickname,u.email,b.user_id,(select count(*) from p_boardview where board_id = b.board_id) as view_cnt,(select count(*) from p_comment where board_id = b.board_id) as com_cnt,b.starttime,b.endtime
              from p_board b join p_user u on b.user_id = u.id where 1=1 ${b_keyword_query_where} ${b_category_query_where}
              union
              select 'question' as type, null as board_id,question_id as board_id,title,q.category,content,q.created_at, u.nickname,u.email,q.user_id,(select count(*) from p_boardview where question_id =q. question_id) as view_cnt,(select count(*) from p_comment where question_id = q. question_id) as com_cnt,null as starttime,null asendtime
              from p_question q join p_user u on q.user_id = u.id where 1=1 ${q_keyword_query_where} ${q_category_query_where}
              order by created_at
            `;
  console.log(query);
  try {
    [rows, fields] = await connection.query(query);
    res.status(200).json({ success: true, items: rows, cnt: rows.length });
  } catch (e) {
    res.status(500).json({ success: false, message: "DB Error", error: e });
  }
};

// @desc      마감직전 게시글 API
// @route     POST /api/v1/board/deadline
// @request   limit
exports.DeadlineBoard = async (req, res, next) => {
  let limit = req.query.limit;

  let deadline_limit = "";

  if (!!limit) {
    deadline_limit = `limit ${limit}`;
  }
  let query = `
              select b.*,u.nickname,u.email,ifnull((select count(board_id) as board_id_cnt from p_boardview
              where board_id = b.board_id group by board_id),0) as view_cnt, ifnull((select count(board_id) as board_id_cnt from p_comment
              where board_id = b.board_id group by board_id),0) as com_cnt
              from p_board as b left join p_user as u on b.user_id = u.id 
              WHERE endtime >= DATE_FORMAT(NOW(),'%Y-%m-%d') ORDER BY endtime asc ${deadline_limit}
            `;
  console.log(query);
  try {
    [rows, fields] = await connection.query(query);
    res.status(200).json({ success: true, items: rows, cnt: rows.length });
  } catch (e) {
    res.status(500).json({ success: false, message: "DB Error", error: e });
  }
};

// 보드인기글 정렬
// @route     POST /api/v1/board/topboard
// @request   limit
exports.topBoard = async (req, res, next) => {
  let order = req.query.order;
  let limit = req.query.limit;

  let top_limit = "";

  if (!!limit) {
    top_limit = `limit ${limit}`;
  }

  let query = `select b.*,u.nickname,u.email,ifnull((select count(board_id) as board_id_cnt from p_boardview where board_id = b.board_id group by board_id),0) as view_cnt,
              ifnull((select count(board_id) as board_id_cnt from scrap_board where board_id = b.board_id group by board_id),0) as like_cnt ,
              ifnull((select count(board_id) as board_id_cnt from p_comment where board_id = b.board_id group by board_id),0) as com_cnt  from p_board as b left join p_user as u on b.user_id = u.id
              order by view_cnt ${order},com_cnt ${order} ${top_limit}`;
  try {
    [result] = await connection.query(query);
    res.status(200).json({ success: true, items: result, cnt: result.length });
  } catch (e) {
    res.status(500).json();
  }
};
