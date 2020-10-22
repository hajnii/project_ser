const jwt = require("jsonwebtoken");
const connection = require("../db/mysql_connection");
const chalk = require("chalk");
const e = require("express");

let nomal_txt = chalk.cyanBright;
let highlight_txt = chalk.yellowBright;

const auth = async (req, res, next) => {
  console.log(chalk.bold("<< 인증 미들웨어 실행 됨 >>"));
  let token;
  try {
    token = req.header("Authorization");
    token = token.replace("Bearer ", "");
    console.log(highlight_txt.bold("login token") + nomal_txt(" - " + token));
  } catch (e) {
    res.status(401).json();
    return;
  }

  console.log(token);

  let user_id;
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    user_id = decoded.user_id;
  } catch (e) {
    res.status(401).json();
    return;
  }
  let query =
    "select u.id, u.email, u.created_at, t.token \
  from p_user as u \
  join p_token as t \
  on u.id = t.user_id \
  where t.user_id = ? and t.token = ?;";

  let data = [user_id, token];

  try {
    [rows] = await connection.query(query, data);
    console.log(query);
    if (rows.length == 0) {
      res.status(401).json({ error: e, message: "tqtq", rows: rows });
      console.log("@@@");
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
    console.log(e);
    res.status(500).json();
    return;
  }
};

module.exports = auth;
