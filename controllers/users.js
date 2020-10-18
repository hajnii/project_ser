const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const chalk = require("chalk");
const crypto = require("crypto");

const connection = require("../db/mysql_connection");
const { query } = require("express");

let nomal_txt = chalk.cyanBright;
let highlight_txt = chalk.yellowBright;

// @desc 회원가입
// @route POST /api/v1/users
// @request email, passwd, nickname, username, name, gender
// @response success

exports.createUser = async (req, res, next) => {
  let email = req.body.email;
  let passwd = req.body.passwd;
  let nickname = req.body.nickname;
  let name = req.body.name;
  //주석
  if (!email || !passwd || !nickname || !name) {
    res.status(400).json({ message: "파라미터 잘못" });
    return;
  }
  if (!validator.isEmail(email)) {
    res.status(400).json({ message: "파라미터 잘못" });
    return;
  }

  const hashedPasswd = await bcrypt.hash(passwd, 8);

  let query =
    "insert into p_user (email, passwd, nickname,name) values (?,?,?,?)";
  let data = [email, hashedPasswd, nickname, name];

  let user_id;
  console.log(query);
  const conn = await connection.getConnection();
  await conn.beginTransaction();

  try {
    [result] = await conn.query(query, data);
    user_id = result.insertId;
  } catch (e) {
    // console.log(e);
    // if (e.errno == 1062) {
    //   res.status(401).json({
    //     success: false,
    //     error: 1,
    //     message: "닉네임이나 아이디 중복을 확인해주세요.",
    //   });
    // }
    await conn.rollback();
    res.status(500).json({ success: false, error: e });
    return;
  }

  const token = jwt.sign({ user_id: user_id }, process.env.ACCESS_TOKEN_SECRET);
  query = "insert into p_token (user_id, token) values (?,?)";
  data = [user_id, token];

  try {
    [result] = await conn.query(query, data);
  } catch (e) {
    await conn.rollback();
    res.status(500).json();
    return;
  }

  await conn.commit();
  await conn.release();
  res.status(200).json({ success: true, token: token });
};

// 아이디 중복확인
// @route POST /api/v1/users/checkid
// @request email
// @response success token

exports.checkId = async (req, res, next) => {
  let email = req.body.email;

  if (email == undefined || email == "") {
    res.status(401).json({
      success: false,
      error: 1,
      message: "아이디를 입력해 주세요",
    });
    return;
  }

  let query = `select * from p_user where email = "${email}"`;
  console.log(query);

  try {
    [result] = await connection.query(query);
    if (result.length > 0) {
      res.status(401).json({
        success: false,
        error: 1,
        message: "이미 가입된 아이디 입니다.",
      });
    } else {
      res.status(200).json({ success: true });
    }
  } catch (e) {
    res.status(500).json({ success: false });
  }
};

// 닉네임 중복확인
// @route POST /api/v1/users/checknik
// @request nickname
// @response success token
exports.checkNickName = async (req, res, next) => {
  let nickname = req.body.nickname;

  if (nickname == undefined || nickname == "") {
    res.status(401).json({
      success: false,
      error: 1,
      message: "닉네임을 입력해 주세요",
    });
    return;
  }

  let query = `select * from p_user where nickname = "${nickname}"`;
  console.log(query);

  try {
    [result] = await connection.query(query);
    if (result.length > 0) {
      res.status(401).json({
        success: false,
        error: 1,
        message: "이미 존재하는 닉네임 입니다.",
      });
    } else {
      res.status(200).json({ success: true });
    }
  } catch (e) {
    res.status(500).json({ success: false });
  }
};

// @desc 로그인
// @route POST /api/v1/users/login
// @request email.passwd
// @response success token

exports.loginUser = async (req, res, next) => {
  let email = req.body.email;
  let passwd = req.body.passwd;

  let query = `select * from p_user where email = "${email}" `;

  let user_id;

  console.log(query);
  try {
    [rows] = await connection.query(query);
    let hashedPasswd = rows[0].passwd;
    user_id = rows[0].id;
    const isMatch = await bcrypt.compare(passwd, hashedPasswd);

    if (isMatch == false) {
      res
        .status(401)
        .json({ message: "아이디와 비밀번호가 맞는지 확인해 주세요." });
      return;
    }
  } catch (e) {
    res.status(500).json({ error: e });
    return;
  }
  const token = jwt.sign({ user_id: user_id }, process.env.ACCESS_TOKEN_SECRET);
  query = "insert into p_token (user_id, token) values (?,?)";
  let qur = `select nickname from p_user where email = "${email}"`;
  data = [user_id, token];

  try {
    [result] = await connection.query(query, data);
    [rows] = await connection.query(qur);
    res
      .status(200)
      .json({ success: true, email: email, token: token, items: rows });
  } catch (e) {
    res.status(500).json();
  }
};
// @desc 내 정보 비번 변경
// @route POST /api/v1/users/changeMyPass
// @parameters email, passwd, new_passwd , nickname,
exports.changeMyPass = async (req, res, next) => {
  let user_id = req.user.id;
  let passwd = req.body.passwd;
  let new_passwd = req.body.new_passwd;

  let query = `select passwd from p_user where id = "${user_id}" `;
  

  console.log(query);
  try {
    [rows] = await connection.query(query);
    let savedPasswd = rows[0].passwd;
    user_id = rows[0].id;
    let isMatch = await bcrypt.compare(passwd, savedPasswd);
    if (isMatch == false) {
      res
        .status(401)
        .json({ message: "아이디와 비밀번호가 맞는지 확인해 주세요." });
      return;
    }
  } catch (e) {
    res.status(500).json({ error: e });
    return;
  }
  user_id = req.user.id;
  
  const hashedPasswd = await bcrypt.hash(new_passwd, 8);
  let upquery = `update p_user set passwd = "${hashedPasswd}" where id = "${user_id}"`;
  
  console.log(upquery)
  try {
    [rows] = await connection.query(upquery);
    if ((rows.affectedRows = 1)) {
      res.status(200).json({ success: true, message: "변경되셨습니다.",items:rows});
    } else {
      res.status(500).json({ success: false ,message:"dr?"});
    }
  } catch (e) {
    res.status(500).json({ success: false,error:e});
  }
};

// @desc 로그아웃
// @route DELETE /api/v1/users/logout
// @request user_id , token
// @response success

exports.logout = async (req, res, next) => {
  let user_id = req.user.id;
  let token = req.user.token;

  let query = "delete from p_token where user_id = ? and token = ?";
  let data = [user_id, token];

  try {
    [result] = await connection.query(query, data);
    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e });
  }
};


// @desc 내 정보 닉넴 변경
// @route POST /api/v1/users/changeMyNik
// @parameters email, passwd, new_passwd , nickname,
exports.changeMyNik = async (req, res, next) => {
  let nickname = req.body.nickname;
  let user_id = req.user.id;

  // 이 유저가, 맞는 유저인지 체크
  let qur = `select * from p_user where id = ${user_id}`;

  let query = `update p_user set nickname = "${nickname}" where id = ${user_id}`;

  if (nickname == undefined || nickname == "") {
    res.status(401).json({
      success: false,
      error: 1,
      message: "닉네임을 입력해 주세요",
    });
    return;
  }

  let nikcheck = `select * from p_user where nickname = "${nickname}"`;
  console.log(query);

  try {
    
    [rows] = await connection.query(nikcheck);

    if (rows.length > 0) {
      res.status(401).json({
        success: false,
        error: 1,
        message: "이미 존재하는 닉네임 입니다.",
      });
    } else {
      try {
        [result] = await connection.query(query);
        [user] = await connection.query(qur);
        res.status(200).json({ success: true ,items : user});
      } catch (e) {
        res.status(500).json({ success: false });
      }
    }
  } catch (e) {
    res.status(500).json({ success: false });
  }
};

// @desc 내 정보 가져오기
// @route POST /api/v1/users/Mypage
// @parameters email, nickname, birth , gender
exports.Mypage = async (req, res, next) => {
  let user_id = req.user.id;

  let query = `select * from p_user where id = ${user_id}`;
  console.log(query);
  try {
    result = await connection.query(query);
    res.status(200).json({ success: true, result: result[0] });
  } catch (e) {
    res.status(500).json({ success: false, error: e });
  }
};

// 회원탈퇴 : db에서 해당 회원의 유저 테이블 정보 삭제
// => 유저 정보가 있는 다른 테이블도 정보 삭제.

// @desc  회원탈퇴 :  유저 테이블에서 삭제, 토큰 테이블에서 삭제
// @route DELETE  /api/v1/users

exports.deleteUser = async (req, res, next) => {
  let user_id = req.user.id;
  let query = `delete from p_user where id = ${user_id}`;

  const conn = await connection.getConnection();
  try {
    await conn.beginTransaction();
    // 첫번째 테이블에서 정보 삭제
    [result] = await conn.query(query);
    // 두번째 테이블에서 정보 삭제
    query = `delete from p_token where user_id = ${user_id}`;
    [result] = await conn.query(query);

    await conn.commit();
    res
      .status(200)
      .json({ success: true, message: "탈퇴가 성공적으로 되었습니다." });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ success: false, error: e });
  } finally {
    conn.release();
  }
};

// @desc  비번변경 ( reset passwd api )
// @route POST /api/v1/users/resetPasswd
// @req   passwd

exports.resetPasswd = async (req, res, next) => {
  let email = req.body.email;
  let passwd = req.body.passwd;
  let user_id = req.user_id;

  // let query = `select * from p_user where id = ${user_id}`;


  let query = "update p_user set passwd = ? where email = ?";
  const hashedPasswd = await bcrypt.hash(passwd, 8);

  data = [hashedPasswd, email];

  try {
    [result] = await connection.query(query, data);
    if ((result.affectedRows = 1)) {
      res.status(200).json({ success: true, message: "변경되셨습니다." });
    } else {
      res.status(500).json({ success: false });
    }
  } catch (e) {
    res
      .status(500)
      .json({ success: false, error: e});
  }
};