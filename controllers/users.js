const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const connection = require("../db/mysql_connection");

// @desc 회원가입
// @route POST /api/v1/users
// @request email, passwd, nickname, username, birth, gender
// @response success

exports.createUser = async (req, res, next) => {
  let email = req.body.email;
  let passwd = req.body.passwd;
  let nickname = req.body.nickname;
  let name = req.body.name;
  let gender = req.body.gender;

  if (!email || !passwd || !nickname || !name || !gender) {
    res.status(400).json({ message: "파라미터 잘못" });
    return;
  }
  if (!validator.isEmail(email)) {
    res.status(400).json({ message: "파라미터 잘못" });
    return;
  }

  const hashedPasswd = await bcrypt.hash(passwd, 8);

  let query =
    "insert into p_user (email, passwd, nickname,name,gender) values (?,?,?,?,?)";
  let data = [email, hashedPasswd, nickname, name, gender];

  let user_id;

  const conn = await connection.getConnection();
  await conn.beginTransaction();

  try {
    [result] = await conn.query(query, data);
    user_id = result.insertId;
  } catch (e) {
    if (e.errno == 1062) {
      res
        .status(401)
        .json({ success: false, error: 1, message: "중복입니다." });
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
  res.status(200).json({ success: true, token: token });
};

// @desc    로그인
// @route   POST /api/v1/moviesUser/login
// @parameters  {email : "hj@naver.com", passwd : "1234"}
exports.loginUser = async (req, res, next) => {
  let email = req.body.email;
  let passwd = req.body.passwd;

  let query = "select * from p_user where email = ? ";
  let data = [email];
  try {
    [rows] = await connection.query(query, data);
    // 디비에 저장된 비밀번호 가져와서
    let savedPasswd = rows[0].passwd;
    // 비밀번호 체크 : 비밀번호가 서로 맞는지 확인
    let isMatch = await bcrypt.compare(passwd, savedPasswd);
    // let isMatch = bcrypt.compareSync(passwd, savedPasswd); 위랑같음
    if (isMatch == false) {
      res.status(400).json({ success: true, result: isMatch });
      return;
    }
    let token = jwt.sign(
      { user_id: rows[0].id },
      process.env.ACCESS_TOKEN_SECRET
    );

    query = "insert into p_token (token,user_id)values(?,?)";
    data = [token, rows[0].id];

    try {
      [result] = await connection.query(query, data);
      res.status(200).json({ success: true, result: isMatch, token: token });
    } catch (e) {
      res.status(500).json({ success: false, error: e });
    }
  } catch (e) {
    res.status(500).json({ success: false, error: e });
  }
};

// @desc  로그아웃(현재의 기기 1개에 대한 로그아웃)
// @route /api/v1/users/logout
exports.logout = async (req, res, next) => {
  // movie_token 테이블에서, 토큰 삭제해야 로그아웃이 되는것이다.
  let user_id = req.user.id;
  let token = req.user.token;

  let query = "delete from p_token where user_id =? and token = ?";
  let data = [user_id, token];

  try {
    [result] = await connection.query(query, data);
    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e });
  }
};

// @desc 이메일 인증번호
// @route POST /api/v1/certi
// @request email, passwd, nickname, username, birth, gender
// @response success

exports.certification = async (req, res, next) => {
  let email = req.body.email;

  if (!validator.isEmail(email)) {
    res.status(400).json({ message: "파라미터 잘못" });
    return;
  }
  let user_id;
  const conn = await connection.getConnection();
  await conn.beginTransaction();

  let query = `select * from p_user where email = "${email}"`;

  try {
    [result] = await conn.query(query);
    if (result.length != 0) {
      res
        .status(401)
        .json({ success: false, error: 1, message: "중복입니다." });
      return;
    }
  } catch (e) {
    res.status(500).json({ success: false, error: e });
    console.log(e);
    return;
  }
  let max = 9999;
  let min = 1111;
  let certinumber = Math.floor(Math.random() * (max - min)) + min;

  query = `
              insert into p_certification (email,certinumber,certitime)
              values ("${email}", ${certinumber}, now())
              ON DUPLICATE KEY UPDATE certitime = now(), certinumber = ${certinumber}; 
              `;
  const main = async () => {
    let transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: "victorehko123@gmail.com",
        pass: "asdf1020!!",
      },
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
      from: `"하진 Team" <ksb12213@naver.com>`,
      to: `"${email}"`,
      subject: "팀톡 인증번호",
      text: `"${certinumber}"`,
      html: `<b>"${certinumber}"</b>`,
    });

    console.log("메시시시시: %s", info.messageId);
  };

  main().catch(console.error);

  try {
    [result] = await connection.query(query);
    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e });
  }
};
