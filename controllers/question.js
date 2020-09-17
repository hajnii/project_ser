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
// @desc 게시글 가져오기(10개씩)
// @route GET /api/v1/question/get
// @request title, content, category
// @response success

exports.latestQuestion = async (req, res, next) => {
  let offset = req.query.offset;
  let limit = req.query.limit;

  if (!offset || !limit) {
    res.status(400).json({ message: "파라미터가 잘 못 되었습니다." });
  }

  let query = `select * from p_question order by created_at desc limit ${offset}, ${limit}`;
  console.log(query);

  try {
    [rows] = await connection.query(query);
    // let created_at = rows[0].created_at;
    // let mili_movieTime = new Date(created_at).getTime;

    // rows = rows.map(function (row) {
    //   return Object.assign({}, row, {
    //     created_date: moment(row.created_date).format("YYYY-MM-DD HH:mm:ss"),
    //   });
    // });

    res.status(200).json({
      success: true,
      items: rows,
      cnt: rows.length,
      //   mili_movieTime: mili_movieTime,
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

  query = `select *,(select count(*) from p_boardview where question_id = ${question_id}) as view_cnt from p_question where id = ${question_id} limit 1`;
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

// @desc    내가 쓴 게시글 삭제
// @route   DELETE /api/v1/question/delete
// @request question_id, user_id, title, content, category, user_id(auth)
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

  query = `delete from p_question where question_id = ${question_id}`;

  try {
    [result] = await connection.query(query);
    res.status(200).json({ success: true, message: "삭제되었습니다" });
    return;
  } catch (e) {
    res.status(500).json();
    return;
  }
};

// @desc      검색하는 API
// @route     GET/api/v1/question/search?keyword=Y
// @request   keyword
// @response  success

exports.searchQuestion = async (req, res, next) => {
  let offset = req.query.offset;
  let limit = req.query.limit;
  let category = req.body.category;
  let keyword = req.query.keyword;

  let query = `select * from p_question WHERE category = '${category}' and
  (title LIKE '%${keyword}%' or content LIKE '%${keyword}%') limit ${offset}, ${limit}`;
  console.log(query);
  try {
    [rows, fields] = await connection.query(query);
    res.status(200).json({ success: true, items: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: "DB Error", error: e });
  }
};
