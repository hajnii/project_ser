const express = require("express");
const dotenv = require("dotenv");
dotenv.config({ path: "./config/config.env" });

const path = require("path");
const morgan = require("morgan");
const users = require("./routes/users");
const board = require("./routes/board");
const comment = require("./routes/comment");
const favorites = require("./routes/favorites");
const question = require("./routes/question");
const qcomment = require("./routes/qcomment");
const mypage = require("./routes/mypage");

const app = express();

app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

app.use(morgan("combined"));

app.use("/api/v1/users", users);
app.use("/api/v1/board", board);
app.use("/api/v1/comment", comment);
app.use("/api/v1/favorites", favorites);
app.use("/api/v1/question", question);
app.use("/api/v1/qcomment", qcomment);
app.use("/api/v1/mypage", mypage);

const PORT = process.env.PORT || 3000;

app.get("/", (req, res, next) => {
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log("App listening on port 3000!");
});
