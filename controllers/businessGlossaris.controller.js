const path = require("path");
const XLSX = require("xlsx");
const ExcelJS = require("exceljs");
const {
  Validator,
  isInvaliedFile,
  headerFilter,
} = require("../packages/validator");
const { users } = require("../data/users");
const { client } = require("../config/mongo");
const {
  dpTermConfig,
} = require("../common/utils/validateConfigs/dp_term.config");
const fs = require("fs");
require("dotenv").config();

const { FILE_ROOT } = process.env;

const termValidator = new Validator(dpTermConfig);

const db = client.db("dp");

const ASSET_TYPE = "dp_term";

async function uploadXls(req, res, next) {
  try {
    const { originalname, filename: name } = isInvaliedFile(req.file);

    let excelPath = path.join(`${FILE_ROOT}/tmp`, name);

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
    } = termValidator.validation(data, options);

    const result = {
      file_name: originalname,
      file_id: name,
      data: resultData,
      err_cnt,
      empty_cnt,
    };

    res.status(201).json({ data: result });
  } catch (err) {
    res.status(400).json({ err });
  }
}

async function DataUpdateFile(req, res, next) {
  try {
    const { file_id } = req.body;

    const Dpasset = db.collection("dpasset");

    await termValidator.insertData(file_id, Dpasset);

    res.status(200).send("SUCCESS");
  } catch (err) {
    res.status(400).json({ err });
  }
}

async function listDownload(req, res, next) {
  try {
    const { filename: name } = isInvaliedFile(req.file);

    const guidePath = path.join(FILE_ROOT, "businessFormGuide.xlsx");

    const excelPath = path.join(`${FILE_ROOT}/tmp`, name);
    const resultPath = path.join(`${FILE_ROOT}/tmp`, "result.xlsx");

    const workbook = new ExcelJS.Workbook();
    const resultWorkbook = new ExcelJS.Workbook();

    await Promise.all([
      workbook.xlsx.readFile(excelPath),
      resultWorkbook.xlsx.readFile(guidePath),
    ]);

    const copyWorksheet = workbook.getWorksheet(2);

    const addWorksheet = resultWorkbook.addWorksheet("비즈니스 용어");

    copyWorksheet.eachRow((row) => {
      addWorksheet.addRow(row.values);
    });

    await resultWorkbook.xlsx.writeFile(resultPath); // 결과 파일로 저장

    res.status(200).json({ msg: "success" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ err });
  }
}

module.exports = { uploadXls, DataUpdateFile, listDownload };
