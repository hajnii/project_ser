const jwt = require("jsonwebtoken");
const chalk = require("chalk");
const connection = require("../db/mysql_connection");

let nomal_txt = chalk.cyanBright;
let highlight_txt = chalk.yellowBright;

const auth = async (req, res, next) => {
  console.log(chalk.bold("<<  인증 미들웨어 실행됨  >>"));
  let token;
  try {
    token = req.header("Authorization");
    token = token.replace("Bearer ", "");
    console.log(highlight_txt.bold("login token") + nomal_txt(" - " + token));
  } catch (e) {
    res.status(401).json({ error: e });
    return;
  }

  let user_id;
  let receiver_id;
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    user_id = decoded.user_id;
    receiver_id = decoded.receiver_id;
  } catch (e) {
    res.status(401).json({ error: e, message: "여기" });
    return;
  }

  let query =
    "select u.id, u.email, u.nickname, u.created_at, u.name , t.token, t.receiver_id\
  from p_token as t \
  join p_user as u \
  on t.user_id = u.id \
  where t.user_id = ? and t.token = ? and t.receiver_id = ?";
  console.log(query);

  let data = [user_id, token, receiver_id];

  try {
    [rows] = await connection.query(query, data);
    if (rows.length == 0) {
      res.status(401).json({ error: e });
      return;
    } else {
      req.user = rows[0];
      console.log(
        highlight_txt.bold("User authorization") +
          nomal_txt(" user_id : ") +
          highlight_txt(user_id) +
          nomal_txt(", email : ") +
          highlight_txt(rows[0].email)
      );
      next();
    }
  } catch (e) {
    res.status(500).json({ error: e });
  }
};

module.exports = auth;
