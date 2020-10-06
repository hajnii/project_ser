const connection = require("../db/mysql_connection");

// @desc    게시글마다 유저가 댓글 달수 있는 API
// @route   post /api/v1/comment
exports.addComment = async (req, res, next) => {
  let user_id = req.user.id;
  let board_id = req.body.board_id;
  let comment = req.body.comment;
  let cmt_no = req.body.cmt_no;

  // 1~3 seq,parent
  let seq = 1;
  let parent = null;

  try {
    if (cmt_no != 0) {
      let query = `
                  select if(isnull(max(seq)),1,max(seq)) as seq from p_comment where parent = ${cmt_no}
                  `;
      [rows] = await connection.query(query);
      seq = rows[0].seq + 1;
      parent = cmt_no;
    }
  } catch (e) {
    res.status(500).json({ error: e });
  }

  //4
  query = `
          insert into p_comment(user_id, parent, board_id, seq, comment) values(${user_id}, ${parent}, ${board_id},${seq}, "${comment}")
          `;

  let qur = `select u.nickname,u.email ,c.* from p_comment as c left join p_user as u on c.user_id = u.id where board_id = ${board_id} order by cmt_no `;

  console.log(query);
  try {
    [result] = await connection.query(query);
    [rows] = await connection.query(qur);
    res.status(200).json({ success: true, items: rows, cnt: rows.length });
  } catch (e) {
    res.status(500).json({ error: e });
  }
};

// 댓글 수정하기
exports.updateComment = async (req, res, next) => {
  let user_id = req.user.id;
  let cmt_no = req.body.cmt_no;
  let comment = req.body.comment;
  let board_id = req.body.board_id;

  let query = `select * from p_comment where cmt_no = ${cmt_no}`;
  try {
    [rows] = await connection.query(query);
    if (rows[0].user_id != user_id) {
      res.status(401).json({ message: "자신의 아이디가 아닙니다." });
      return;
    }
  } catch (e) {
    res.status(500).json({ message: "여기인거같은데" });
    return;
  }

  query = `update p_comment set comment = "${comment}"  where cmt_no = ${cmt_no}`;
  let qur = `select u.nickname,u.email ,c.* from p_comment as c left join p_user as u on c.user_id = u.id where board_id = ${board_id} order by cmt_no  `;
  console.log(query);

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

// @desc    자신이 적은 댓글 삭제하기
// @route   Delete /api/v1/comment
exports.deleteComment = async (req, res, next) => {
  let cmt_no = req.body.cmt_no;
  let user_id = req.user.id;
  let board_id = req.body.board_id;
  // 해당 유저의 댓글이 맞는지 체크
  let query = `select * from p_comment where cmt_no = ${cmt_no}`;

  try {
    [rows] = await connection.query(query);
    if (rows[0].user_id != user_id) {
      res.status(401).json({ message: "자신의 아이디가 아닙니다." });
      return;
    }
  } catch (e) {
    res.status(500).json();
    return;
  }

  query = `delete from p_comment where cmt_no = ${cmt_no} or parent = ${cmt_no}`;
  let qur = `select u.nickname,u.email ,c.* from p_comment as c left join p_user as u on c.user_id = u.id where board_id = ${board_id} order by cmt_no  `;

  try {
    [result] = await connection.query(query);
    [rows] = await connection.query(qur);
    res.status(200).json({ success: true, items: rows, cnt: rows.length });
    return;
  } catch (e) {
    res.status(500).json();
    return;
  }
};

// @desc 댓글 가져오기(15개씩)
// @route GET /api/v1/comment

exports.getCommentlist = async (req, res, next) => {
  let offset = req.query.offset;
  let limit = req.query.limit;
  let board_id = req.body.board_id;

  if (!offset || !limit) {
    res.status(400).json({ message: "파라미터가 잘 못 되었습니다." });
  }

  let query = `select c.* , u.email , u.nickname from p_comment as c join p_user as u on c.user_id = u.id where board_id = ${board_id} order by created_at limit ${offset}, ${limit}`;
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
