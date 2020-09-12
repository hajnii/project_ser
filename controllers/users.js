const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const chalk = require("chalk");
const crypto = require("crypto");

const connection = require("../db/mysql_connection");

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
    console.log(e);
    if (e.errno == 1062) {
      res.status(401).json({
        success: false,
        error: 1,
        message: "닉네임이나 아이디 중복을 확인해주세요.",
      });
    }
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
  res.status(200).json({ success: true, result: result, token: token });
};

// @desc 로그인
// @route POST /api/v1/users/login
// @request email.passwd
// @response success token

exports.loginUser = async (req, res, next) => {
  let email = req.body.email;
  let passwd = req.body.passwd;

  let query = "select * from p_user where email = ? ";
  let data = [email];

  let user_id;

  try {
    [rows] = await connection.query(query, data);
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
    res.status(500).json();
    return;
  }
  const token = jwt.sign({ user_id: user_id }, process.env.ACCESS_TOKEN_SECRET);
  query = "insert into p_token (user_id, token) values (?,?)";
  data = [user_id, token];
  try {
    [result] = await connection.query(query, data);
    res.status(200).json({ success: true, email: email, token: token });
  } catch (e) {
    res.status(500).json();
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

// @desc 내 정보 변경
// @route POST /api/v1/users/change
// @parameters email, passwd, new_passwd , name, nickname, gender
exports.changePasswd = async (req, res, next) => {
  let email = req.body.email;
  let passwd = req.body.passwd;
  let name = req.body.name;
  let nickname = req.body.nickname;
  let gender = req.body.gender;
  let new_passwd = req.body.new_passwd;

  // 이 유저가, 맞는 유저인지 체크
  let query = "select passwd from p_user where email =?";
  let data = [email];

  try {
    [rows] = await connection.query(query, data);
    let savedPasswd = rows[0].passwd;
    let isMatch = bcrypt.compareSync(passwd, savedPasswd);
    if (isMatch != true) {
      res
        .status(401)
        .json({ success: false, result: "아이디와 비밀번호를 확인해 주세요." });
      return;
    }
  } catch (e) {
    res.status(500).json({ success: false, error: e });
  }

  query =
    "update p_user set passwd = ? , name =? , nickname =? , gender = ? where email =?";
  const hashedPasswd = await bcrypt.hash(new_passwd, 8);
  data = [hashedPasswd, name, nickname, gender, email];

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
      .json({ success: false, error: 1, message: "닉네임이 중복되었습니다." });
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

// 유저가 패스워드를 분실!

// 1. 클라이언트가 패스워드 분실했다고 서버한테 요청
//    서버가 패스워드를 변경할수 있는 url을 클라이언트한테 보내준다.
//    (경로에 암호회된 문자열을 보내줍니다-토큰역할)

// @desc  패스워드 분석
// @route POST  /api/v1/users/forgot
exports.forgotPasswd = async (req, res, next) => {
  let user = req.user;
  // 암호화된 문자열 만드는 방법
  const resetToken = crypto.randomBytes(20).toString("hex");
  const resetPasswdToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // 유저 테이블에, reset_passwd_token 컬럼에 저장.
  let query = "update p_user set reset_passwd_token = ? where id = ?";
  let data = [resetPasswdToken, user.id];

  try {
    [result] = await connection.query(query, data);
    user.reset_passwd_token = resetPasswdToken;
    res.status(200).json({ success: true, data: user });
  } catch (e) {
    res.status(500).json({ success: false, error: e });
  }
};

// 2. 클라이언트는 해당 암호화된 주소를 받아서, 새로운 비밀번호를 함께
//    서버로 보낸다.
//    서버는, 이 주소가 진짜 유효한지 확인해서, 새로운 비밀번호로 셋팅.

// @desc  리셋 패스워드 토큰을, 경로로 만들어서, 바꿀 비번과 함께 요청
//        비번 초기화 ( reset passwd api )
// @route POST /api/v1/users/resetPasswd/:resetPasswdToken
// @req   passwd

exports.resetPasswd = async (req, res, next) => {
  const resetPasswdToken = req.params.resetPasswdToken;
  const user_id = req.user.id;

  let query = "select * from p_user where id = ?";
  let data = [user_id];

  try {
    [rows] = await connection.query(query, data);
    savedResetPasswdToken = rows[0].reset_passwd_token;
    if (savedResetPasswdToken !== resetPasswdToken) {
      res.status(400).json({ success: false });
      return;
    }
  } catch (e) {
    res.status(500).json({ success: false, error: e });
    return;
  }

  let passwd = req.body.passwd;

  const hashedPasswd = await bcrypt.hash(passwd, 8);

  query = "update p_user set passwd = ?, reset_passwd_token = '' where id = ?";
  data = [hashedPasswd, user_id];

  delete req.user.reset_passwd_token;

  try {
    [result] = await connection.query(query, data);
    res.status(200).json({ success: true, data: req.user });
  } catch (e) {
    res.status(500).json({ success: false, error: e });
  }
};
