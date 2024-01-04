const express = require("express");
const multer = require("multer");
const XLSX = require("xlsx");
const compression = require("compression");
const { reportConfig, validate } = require("./config");
const { client } = require("./config/mongo");

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

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

const modifyingName = (str) => str.replace(/\s/g, "").replace(/\([^)]*\)/g, "");

/**
 * 가로 병합된 헤더가 존재하는지 체크 및 데이터 가공
 * @param {WorkSheet} workSheet
 * @returns {WorkSheet.rows[]}
 */
function headerFilter(workSheet) {
  let data = XLSX.utils.sheet_to_json(workSheet, {
    defval: "",
    header: 1,
  });

  let isEmpty = false;

  for (const row of data[0]) {
    if (!row) {
      isEmpty = true;
    }
  }

  if (isEmpty) {
    const objKeys = data[0];
    let prev = "";
    for (let i = 0; i < objKeys.length; i++) {
      const cur = objKeys[i];

      if (!!cur && !!data[1][i]) {
        if (cur === "SQL") {
          objKeys[i] = data[1][i] + cur;
          prev = cur;
          continue;
        }

        objKeys[i] += data[1][i];

        prev = cur;
      } else if (!cur && data[1][i]) {
        if (cur === "SQL" || prev === "SQL") {
          objKeys[i] = data[1][i] + prev;
          continue;
        }
        objKeys[i] = prev + data[1][i];
      }
    }

    const newObjKeys = objKeys.map(modifyingName);

    const newData = [];

    for (let i = 2; i < data.length; i++) {
      const obj = {};
      for (let j = 0; j < newObjKeys.length; j++) {
        obj[newObjKeys[j]] = data[i][j];
      }

      newData.push(obj);
    }

    return newData;
  } else {
    return XLSX.utils.sheet_to_json(workSheet, {
      defval: "",
    });
  }
}

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
      // const data = XLSX.utils.sheet_to_json(workSheet, {
      //   defval: "",
      //   header: 1,
      // });

      const data = headerFilter(workSheet);

      result.data[0] = ["검증결과", ...Object.keys(data[0]).map(modifyingName)];
      result.data[1] = ["결과", ...Object.keys(data[0])];

      ///////////////////////////////////////////////////////////////////////////

      console.time("test");
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
      console.timeEnd("test");
      console.log(`현재 실행 중인 Node.js 프로세스의 PID: ${process.pid}`);

      ///////////////////////////////////////////////////////////////////////////

      result.data.push(...resultData);
      result.err_cnt = err_cnt;
      result.empty_cnt = empty_cnt;
    }

    res.status(200).json({ data: result });
  } catch (err) {
    console.error(err);
    res.status(400).json({ err: err.message });
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
