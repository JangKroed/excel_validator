const path = require("path");
const XLSX = require("xlsx");
const {
  fileValidate2,
  headerFilter,
  excelDataProcessing,
} = require("../common/utils/validate/validator");
const { users } = require("../common/utils/data/users");
const { client } = require("../config/mongo");
const {
  dpTermConfig,
} = require("../common/utils/validate/config/dp_term.config");
require("dotenv").config();

const { FILE_ROOT } = process.env;

const temp = {};

async function uploadXls(req, res, next) {
  try {
    const { originalname, size, filename: name } = req.file;

    if (!req.file) {
      throw new Error("No file content uploaded");
    }

    if (originalname.split(".").at(-1) !== "xlsx") {
      throw new Error("엑셀 파일이 아닙니다");
    }

    const MAX_FILE_SIZE = 1024 * 1024 * 3;
    if (size > MAX_FILE_SIZE) {
      throw new Error("최대 3MB 까지 가능합니다.");
    }

    let excelPath = path.join(FILE_ROOT, name);

    const workBook = XLSX.readFile(excelPath, {
      type: "binary",
      cellDates: true,
      cellNF: false,
      cellText: false,
    });

    if (workBook.SheetNames.length !== 2) {
      throw new Error("업로드양식이 아닙니다(시트2개구성)");
    }

    const data = headerFilter(workBook.Sheets[workBook.SheetNames[1]]);
    if (data.length > 1002) {
      throw new Error(
        " 1,000건까지만 가능합니다(현재 " + (data.length - 2) + "건)",
      );
    }

    const user = users;

    const Standard = client.db("dp").collection("standard");
    const [termsResult] = await Standard.aggregate([
      { $match: { _id: "terms_category" } },
      { $group: { _id: "$children.value" } },
    ]).toArray();
    const term = termsResult._id.filter((e) => !!e);

    const {
      data: resultData,
      err_cnt,
      empty_cnt,
    } = fileValidate2(dpTermConfig, data, { user, term });

    const result = {
      file_name: originalname,
      file_id: name,
      data: resultData,
      err_cnt,
      empty_cnt,
    };

    temp[name] = resultData.length;
    console.log(temp);

    res.status(201).json({ data: result });
  } catch (err) {
    console.error(err);
  }
}

async function DataUpdateFile(req, res, next) {
  try {
    const { file_id } = req.body;

    const db = client.db("dp");
    const Dpasset = db.collection("dpasset");
    const DpTermHistory = db.collection("dp_term_histroy");
    const dirPath = path.join(FILE_ROOT, file_id);

    const workBook = XLSX.readFile(dirPath, {
      type: "binary",
      cellDates: true,
      cellNF: false,
      cellText: false,
    });

    if (workBook.SheetNames.length !== 2) {
      throw new Error(
        "포맷이 틀립니다 시트1(TABLE), 시트2(컬럼) 으로 구성해주세요",
      );
    }

    const data = headerFilter(workBook.Sheets[workBook.SheetNames[1]]);

    const user = users;

    const refer = await Dpasset.aggregate([
      { $match: { asset_type: "dp_term" } },
      { $project: { _id: 1 } },
      { $project: { _id: { $objectToArray: "$$ROOT" } } },
      { $unwind: "$_id" },
      { $group: { _id: "$_id.v" } },
    ]).toArray();

    const option = {
      user,
      token_info: req.token_info,
      refer: refer.map((e) => e._id),
    };

    const { terms, histories } = excelDataProcessing(
      dpTermConfig,
      data,
      option,
    );

    // TODO - terms, histories bulk upsert
    // await mongoBulkUpsert(collection, terms)
    // await mongoBulkUpsert(history_collection, histories)

    res.status(200).send("SUCCESS");
  } catch (err) {
    console.error(err);
  }
}

module.exports = { uploadXls, DataUpdateFile };
