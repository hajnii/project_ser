const connection = require("../db/mysql_connection");

// @desc 댓글 가져오기
// @route   post /api/v1/comment/
// @request  user_id(auth),board_id,cmt_no

exports.getCommentlist = async (req, res, next) => {
  let board_id = req.body.board_id;


  let query = `select c.* , u.email , u.nickname from p_comment as c join p_user as u on c.user_id = u.id where board_id = ${board_id} order by created_at`;
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

// @desc    게시글마다 유저가 댓글 달수 있는 API
// @route   post /api/v1/comment/add
// @request  user_id(auth),board_id,comment,cmt_no
exports.addComment = async (req, res, next) => {
  let user_id = req.user.id;
  let board_id = req.body.board_id;
  let comment = req.body.comment;
  let cmt_no = req.body.cmt_no;

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
// @route   post /api/v1/comment/update
// @request  user_id(auth),board_id,comment,cmt_no
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
// @route   post /api/v1/comment/delete
// @request  user_id(auth),board_id,cmt_no
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
