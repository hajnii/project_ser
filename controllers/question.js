const moment = require("moment");
const connection = require("../db/mysql_connection");

// @desc 질문 게시글 업로드 하는 API
// @route PUT /api/v1/question
// @request title, content, category ,user_id(auth)
// @response success

exports.uploadQuestion = async (req, res, next) => {
  let user_id = req.user.id;
  let title = req.body.title;
  let content = req.body.content;
  let category = req.body.category;

  if (!user_id || !title || !content || !category) {
    res.status(400).json({ message: "hi" });
    return;
  }

  let query = `insert into p_question (title, content , category , user_id) values (
        "${title}", "${content}","${category}",${user_id})`;
  console.log(query);
  try {
    [result] = await connection.query(query);
  } catch (e) {
    res.status(500).json({ success: false, message: "여기인가?" });
    return;
  }

  query = `select * from p_question where user_id = ${user_id} order by created_at desc limit 1`;
  console.log(query);

  try {
    [data] = await connection.query(query);
    res.status(200).json({ success: true, data: data });
    return;
  } catch (e) {
    res.status(500).json();
    return;
  }
};
// @desc 최신순으로 질문 게시글 가져오는 API
// @route GET /api/v1/question/lastestQuestion
// @request limit
// @response success

exports.latestQuestion = async (req, res, next) => {
  let limit = req.query.limit;
  let q_limit_query = "";

  if (!!limit) {
    q_limit_query = `limit ${limit}`;
  }

  let query = `select q.*,u.nickname,u.email,ifnull((select count(question_id) from p_boardview where question_id = q.question_id group by question_id),0) as view_cnt, ifnull((select count(question_id) as question_id_cnt from p_comment
			        	where question_id = q.question_id group by question_id),0) as com_cnt
                from p_question as q left join p_user as u on q.user_id = u.id 
                order by created_at desc ${q_limit_query}`;
  console.log(query);

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

// @desc    게시글을 하나를 선택해서 상세보기하면 조회수도 올라간다.(로그인유저 하루에 한번만)
// @route   POST /api/v1/question/view
// @request question_id , user_id
// @response success

exports.viewQuestion = async (req, res, next) => {
  let user_id = req.user.id;
  let question_id = req.body.question_id;

  let query = `
                  insert into p_boardview(question_id, user_id, boardview)
                  values(${question_id}, ${user_id}, now())
                  ON DUPLICATE KEY UPDATE boardview = now();
                `;

  try {
    [data] = await connection.query(query);
  } catch (e) {
    console.log(e);
    res.status(500).json();
    return;
  }

  query = `select q.* ,u.nickname, (select count(*) from p_boardview where question_id = ${question_id}) as view_cnt,
  (select count(*) from scrap_board where question_id = ${question_id} and user_id = ${user_id}) as is_favorite
  from p_question as q join p_user as u on q.user_id = u.id where question_id =  ${question_id} limit 1`;
  console.log(query);

  try {
    [rows] = await connection.query(query);
    res.status(200).json({ success: true, items: rows });
    return;
  } catch (e) {
    res.status(500).json();
    return;
  }
};

// @desc    게시글 상세보기(비회원)
// @route   POST /api/v1/question/nomem
// @request question_id
// @response success
exports.qmemberBoard = async (req, res, next) => {
  // console.log(req);
  let question_id = req.body.question_id;

  let query = `select q.* , (select count(*) from p_boardview where question_id = ${question_id}) as view_cnt , 
  (select count(*) from scrap_board where question_id = ${question_id}) as is_favorite
  from p_question as q left join p_user as u on q.question_id = u.id where question_id = ${question_id};`;

  try {
    [data] = await connection.query(query);
    res.status(200).json({ data: data, success: true });
    return;
  } catch (e) {
    res.status(500).json();
    return;
  }
};

// @desc    내가 쓴 게시글 수정
// @route   PUT /api/v1/question/update
// @request question_id, user_id, title, content, category, user_id(auth)
// @response success

exports.updateQuestion = async (req, res, next) => {
  let user_id = req.user.id;
  let question_id = req.body.question_id;
  let title = req.body.title;
  let content = req.body.content;
  let category = req.body.category;

  let query = `select * from p_question where question_id = ${question_id}`;
  try {
    [rows] = await connection.query(query);
    if (rows[0].user_id != user_id) {
      res.status(401).json({ message: "자신의 아이디가 아닙니다." });
      return;
    }
  } catch (e) {
    res.status(500).json({ success: false });
    return;
  }

  query = `update p_question set content = "${content}" , title = "${title}", category = "${category}" where question_id = ${question_id}`;
  console.log(query);

  let qur = `select u.nickname ,q.* from p_question as q
              left join p_user as u 
              on q.user_id = u.id 
              where question_id = ${question_id}`;

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

// @desc    내가 쓴 게시글 삭제
// @route   DELETE /api/v1/question/delete
// @request question_id, user_id(auth)
// @response success

exports.deleteQuestion = async (req, res, next) => {
  let user_id = req.user.id;
  let question_id = req.body.question_id;

  // 해당 유저의 댓글이 맞는지 체크
  let query = `select * from p_question where question_id = ${question_id}`;

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

  let qboardquery = `delete from p_question where question_id = ${question_id}`;

  try {
    [result] = await connection.query(qboardquery);
    res.status(200).json({ success: true, message: "삭제되었습니다" });
  } catch (e) {
    res.status(500).json();
    return;
  }
  
  let qcommentquery = `delete from p_comment where question_id = ${question_id}`
  
  try {
    [result] = await connection.query(qcommentquery);
    console.log(qcommentquery)
    res.status(200).json({ success: true, message: "삭제되었습니다" });
    return;
  } catch (e) {
    res.status(500).json();
    return;
  }
};

// 질문인기글
// @route     POST /api/v1/question/topboard
// @request   limit
exports.qtopBoard = async (req, res, next) => {
  let order = req.query.order;
  let limit = req.query.limit;

  let top_limit = "";

  if (!!limit) {
    top_limit = `limit ${limit}`;
  }

  let query = `select b.*,u.nickname,u.email,ifnull((select count(question_id) as question_id_cnt from p_boardview where question_id = b.question_id group by question_id),0) as view_cnt,
  ifnull((select count(question_id) as question_id_cnt from scrap_board where question_id = b.question_id group by question_id),0) as like_cnt ,
  ifnull((select count(question_id) as question_id_cnt from p_comment where question_id = b.question_id group by question_id),0) as com_cnt  from p_question as b left join p_user as u on b.user_id = u.id
  order by view_cnt ${order},com_cnt ${order} ${top_limit}`;
  try {
    [result] = await connection.query(query);
    res.status(200).json({ success: true, items: result, cnt: result.length });
  } catch (e) {
    res.status(500).json();
  }
};
