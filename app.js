const express = require("express");
const multer = require("multer");
const XLSX = require("xlsx");
const { reportConfig, validate } = require("./config");
const { client } = require("./config/mongo");

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());

const modifyingName = (str) => str.replace(/\s/g, "").replace(/\([^)]*\)/g, "");

app.post("/upload", upload.single("excelFile"), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new Error("not empty file");
    }

    const { originalname, buffer, size } = req.file;

    if (originalname.split(".").at(-1) !== "xlsx") {
      throw new Error("지원하지 않는 파일 형식입니다.");
    }

    const MAX_FILE_SIZE = 1024 * 1024 * 3;
    if (size > MAX_FILE_SIZE) {
      throw new Error("최대 3MB 까지 업로드 가능합니다.");
    }

    const workbook = XLSX.read(buffer, { type: "buffer" });

    // worksheet length and name(config) check
    const wsnames = workbook.SheetNames;

    // 여기서 반복문으로 sheet 단위로 json 변환 후 validate 작업 실행
    const result = {
      file_name: originalname,
      file_id: "123123123",
      data: new Array(2),
    };

    for (const sheetName of wsnames) {
      if (sheetName === "작성가이드라인") {
        continue;
      }

      const workSheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(workSheet, { defval: "" });

      result.data[0] = ["검증결과", ...Object.keys(data[0]).map(modifyingName)];
      result.data[1] = ["결과", ...Object.keys(data[0])];

      ///////////////////////////////////////////////////////////////////////////

      const {
        result: resultData,
        err_cnt,
        empty_cnt,
      } = await validate(reportConfig, data, {
        user: {
          AP020498: 1,
          FP017190: 1,
          MP02136: 1,
          CP017849: 1,
          AP018013: 1,
        },
      });

      ///////////////////////////////////////////////////////////////////////////

      result.data.push(...resultData);
      result.err_cnt = err_cnt;
      result.empty_cnt = empty_cnt;
    }

    res.status(200).json({ data: result });
  } catch (err) {
    console.error(err);
    res.status(400).json({ err });
  }
});

app.listen(1005, () => {
  console.log("Server Start!");
  client
    .connect()
    .then(() => {
      console.log("MongoDB Connect!");
    })
    .catch(console.error);
});
