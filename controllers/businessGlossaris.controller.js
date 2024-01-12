const path = require("path");
const XLSX = require("xlsx");
const ExcelJS = require("exceljs");
const {
  Validator,
  isInvaliedFile,
  headerFilter,
} = require("../packages/validator");
// const { users } = require("../data/users");
const { client } = require("../config/mongo");
const {
  dpTermConfig,
} = require("../common/utils/validateConfigs/new/dp_term.config");
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

    const user = await db.collection("usr_user").find().toArray();

    const DpassetTerm = db.collection("dpasset_term");
    const refer = await DpassetTerm.aggregate([
      { $match: { asset_type: ASSET_TYPE } },
      { $project: { _id: 1 } },
    ]).toArray();

    const Dpasset = db.collection("dpasset");
    const columns = await Dpasset.aggregate([
      { $match: { asset_type: "column" } },
      { $project: { name: 1, dataset_id: 1 } },
    ]).toArray();

    const options = {
      user,
      columns,
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
    console.error(err);
    res.status(400).json({ err });
  }
}

async function DataUpdateFile(req, res, next) {
  try {
    const { file_id } = req.body;

    const DpassetTerm = db.collection("dpasset_term");

    await termValidator.insertData(file_id, DpassetTerm);

    res.status(200).send("SUCCESS");
  } catch (err) {
    res.status(400).json({ err });
  }
}

async function listDownload(req, res, next) {
  try {
    const { filename: name } = isInvaliedFile(req.file);

    const guidePath = path.join(FILE_ROOT, "businessForm.xlsx");

    const excelPath = path.join(`${FILE_ROOT}/tmp`, name);
    const resultPath = path.join(`${FILE_ROOT}/tmp`, "result.xlsx");

    const workbook = new ExcelJS.Workbook();
    const resultWorkbook = new ExcelJS.Workbook();

    await Promise.all([
      workbook.xlsx.readFile(excelPath),
      resultWorkbook.xlsx.readFile(guidePath),
    ]);

    const copyWorksheet = workbook.getWorksheet(2);

    const addWorksheet = resultWorkbook.getWorksheet(2);

    let rowCount = 0;
    let firstRow = true;
    copyWorksheet.eachRow((row) => {
      if (firstRow) {
        firstRow = false;
      } else {
        addWorksheet.addRow(row.values);
        rowCount++;
      }
    });

    console.log("lastRow: ", rowCount);

    await resultWorkbook.xlsx.writeFile(resultPath);

    res.status(200).json({ msg: "success" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ err });
  }
}

module.exports = { uploadXls, DataUpdateFile, listDownload };

const example = {
  _id: "UUID",
  name: "bis_term",
  desc: "description",
  owner: [
    {
      owner_dept_id: "DEPT_ID",
      owner_user_id: "USER_ID",
      it_owner_dept_id: "DEPT_ID",
      it_owner_user_id: "USER_ID",
    },
  ],
  tags: "any,any,any",
  col_dataset_ids: [
    {
      name: "last",
      dataset_id: "other",
    },
  ],
  it_terms: ["any"],
  calc_period: "any",
  anal_calc_period: "any",
  calc_formula: "any",
  calc_std: "any",
  source_sql: "any",
  info_sql: "any",
  big_sql: "any",
  // 시스템명::보고서 파일명::보고서명::항목명
  report_dataset: [
    {
      report_id: "report_id",
      item_name: "item_nm", // 항목명
    },
  ],
  etc: "any",
  resistered: "created_time",
  updated: "created_time" && "updated_time",
};
