const multer = require("multer");
require("dotenv").config();

const { FILE_ROOT } = process.env;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, `${FILE_ROOT}/tmp`);
  },
  filename: (req, file, cb) => {
    const randomNumber = Math.floor(Math.random() * 10000);
    cb(null, `${Date.now()}_${randomNumber.toString().padStart(5, "0")}`);
  },
});
const upload = multer({ storage });

module.exports = { upload };
