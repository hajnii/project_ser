const connection = require("../db/mysql_connection");

///  질문게시팔

// @desc    게시글마다 유저가 댓글 달수 있는 API
// @route   post /api/v1/comment
exports.addQComment = async (req, res, next) => {
  let user_id = req.user.id;
  let question_id = req.body.question_id;
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
            insert into p_comment(user_id, parent, question_id, seq, comment) values(${user_id}, ${parent}, ${question_id},${seq}, "${comment}")
            `;

  let qur = `select u.nickname ,c.* from p_comment as c left join p_user as u on c.user_id = u.id order by cmt_no desc limit 1`;

  console.log(query);
  try {
    [rows] = await connection.query(query);
    [result] = await connection.query(qur);
    res.status(200).json({ success: true, items: result });
  } catch (e) {
    res.status(500).json({ error: e });
  }
};

// 댓글 수정하기
exports.updateQComment = async (req, res, next) => {
  let user_id = req.user.id;
  let cmt_no = req.body.cmt_no;
  let comment = req.body.comment;

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

  query = `update p_comment set comment = "${comment}"  where cmt_no= ${cmt_no}`;

  let qur = `select u.nickname ,c.* from p_comment as c left join p_user as u on c.user_id = u.id where cmt_no = ${cmt_no}`;

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
exports.deleteQComment = async (req, res, next) => {
  let cmt_no = req.body.cmt_no;
  let user_id = req.user.id;
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

  try {
    [result] = await connection.query(query);
    res.status(200).json({ success: true });
    return;
  } catch (e) {
    res.status(500).json();
    return;
  }
};

// @desc 댓글 가져오기(15개씩)
// @route GET /api/v1/comment

exports.getQCommentlist = async (req, res, next) => {
  let offset = req.query.offset;
  let limit = req.query.limit;
  let question_id = req.body.question_id;

  if (!offset || !limit) {
    res.status(400).json({ message: "파라미터가 잘 못 되었습니다." });
  }

  let query = `select c.* , u.nickname from p_comment as c join p_user as u on c.user_id = u.id where question_id = ${question_id} order by created_at limit ${offset}, ${limit}`;
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