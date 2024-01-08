const express = require("express");
const compression = require("compression");
const { client } = require("./config/mongo");
const fs = require("fs");
require("dotenv").config();

const app = express();

const compFilter = (req, res) => {
  // header에 x-no-compression이 있으면, 압축하지 않도록 false를 반환한다.
  if (req.headers["x-no-compression"]) {
    return false;
  }
  return compression.filter(req, res);
};

app.use(express.json());
app.use(
  compression({
    level: 6,
    threshold: 100 * 1000,
    filter: compFilter,
  }),
);
app.use("/api", require("./routes"));

app.listen(1005, () => {
  console.log("Server Start!");
  client
    .connect()
    .then(() => {
      console.log("MongoDB Connect!");
    })
    .catch(console.error);
});

// (() => {
//   fs.readdir(process.env.FILE_ROOT, (err, files) => {
//     if (err) {
//       console.error("폴더를 읽을 수 없습니다.", err);
//       return;
//     }
//
//     if (files.length) {
//       for (const file of files) {
//         fs.unlinkSync(`${process.env.FILE_ROOT}/${file}`);
//       }
//     }
//   });
// })();
