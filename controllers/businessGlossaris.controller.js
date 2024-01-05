const path = require("path");
const XLSX = require("xlsx");
const { Validator } = require("../common/utils/validate/validator");
const { users } = require("../common/utils/data/users");
const { client } = require("../config/mongo");
const {
  dpTermConfig,
} = require("../common/utils/validate/config/dp_term.config");
require("dotenv").config();

const { FILE_ROOT } = process.env;

const { excelValidate, headerFilter, insertData } = new Validator(dpTermConfig);

const db = client.db("dp");

const ASSET_TYPE = "dp_term";

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

    const Standard = db.collection("standard");
    const [termsResult] = await Standard.aggregate([
      { $match: { _id: "terms_category" } },
      { $group: { _id: "$children.value" } },
    ]).toArray();
    const term = termsResult._id.filter((e) => !!e);

    const Dpasset = db.collection("dpasset");
    const refer = await Dpasset.aggregate([
      { $match: { asset_type: ASSET_TYPE } },
      { $project: { _id: 1 } },
      { $project: { _id: { $objectToArray: "$$ROOT" } } },
      { $unwind: "$_id" },
      { $group: { _id: "$_id.v" } },
    ]).toArray();

    const options = {
      user,
      term,
      fileId: name,
      refer: refer.map((e) => e._id),
      asset_type: ASSET_TYPE,
    };

    const {
      data: resultData,
      err_cnt,
      empty_cnt,
    } = excelValidate(data, options);

    const result = {
      file_name: originalname,
      file_id: name,
      data: resultData,
      err_cnt,
      empty_cnt,
    };

    res.status(201).json({ data: result });
  } catch (err) {
    console.error(err);
  }
}

async function DataUpdateFile(req, res, next) {
  try {
    const { file_id } = req.body;

    const Dpasset = db.collection("dpasset");

    await insertData(file_id, Dpasset);

    res.status(200).send("SUCCESS");
  } catch (err) {
    console.error(err);
  }
}

module.exports = { uploadXls, DataUpdateFile };
