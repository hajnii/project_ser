const connection = require("../db/mysql_connection");

// @desc 메세지를 보내는 API
// @route POST /api/v1/message
// @request title, content, receiver_id ,user_id(auth)
// @response success

exports.sendmessage = async (req, res, next) => {
  let user_id = req.user.id;
  let receiver_id = req.user.receiver_id;
  let title = req.body.title;
  let content = req.body.content;
  let receive_id = req.body.receive_id;

  if (!user_id || !title || !content || !receiver_id) {
    res.status(400).json({ message: "hi" });
    return;
  }

  console.log(receiver_id);
  console.log(receive_id);

  // let query = `insert into p_message (title, content , receiver_id ,user_id) values (
  //         "${title}", "${content}",${receiver_id},${user_id})`;
  let query = `insert into p_message (title, content , receiver_id ,user_id) 
  select "${title}", "${content}",${receive_id},${user_id} from dual where exists (select * from p_token where receiver_id = ${receiver_id})`;

  console.log(query);

  try {
    [result] = await connection.query(query);
    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: "아이디가 없습니다." });
    return;
  }
};

// @desc 자신이 받은 메세지 불러오기
// @route GET /api/v1/message
// @request user_id(auth)
// @response success, items[], cnt

exports.getmessage = async (req, res, next) => {
  let user_id = req.user.id;

  if (!user_id) {
    res.status(400).json();
    return;
  }

  let query = `select m.* , u.nickname from p_message as m join p_user as u on m.user_id = u.id where receiver_id = ${user_id} order by create_at desc`;
  console.log(user_id);
  console.log(query);
  try {
    [rows] = await connection.query(query);
    res.status(200).json({ success: true, items: rows, cnt: rows.length });
  } catch (e) {
    res.status(500).json({ success: false, message: "여기" });
  }
};

// @desc 내가 쓴 메세지 가져오기(10개씩)
// @route GET /api/v1/message/my
// @request offset limit user_i(auth)
// @response success

exports.mymessage = async (req, res, next) => {
  let user_id = req.user.id;
  let offset = req.query.offset;
  let limit = req.query.limit;

  if (!offset || !limit || !user_id) {
    res.status(400).json({ message: "파라미터가 잘 못 되었습니다." });
  }

  let query = `select * from p_message where user_id = ${user_id} order by create_at desc limit ${offset}, ${limit}`;
  console.log(query);

  try {
    [rows] = await connection.query(query);
    res.status(200).json({ success: true, items: rows, cnt: rows.length });
  } catch (e) {
    res.status(400).json({ success: false });
  }
};
