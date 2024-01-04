const path = require("path");
const XLSX = require("xlsx");
const moment = require("moment");
const {
  fileValidate2,
  headerFilter,
  excelDataProcessing,
} = require("../common/utils/validate/validator");
const { users } = require("../common/utils/data/users");
const { client } = require("../config/mongo");
const {
  reportConfig,
} = require("../common/utils/validate/config/report.config");
const {
  reportColumnConfig,
} = require("../common/utils/validate/config/report_column.config");
require("dotenv").config();

const { FILE_ROOT } = process.env;

async function DataReportUpload(req, res) {
  try {
    const { file_id } = req.body;

    if (!req.file) {
      throw new Error("No file content uploaded");
    }

    const { originalname, size, filename: name } = req.file;
    const dirPath = path.join(FILE_ROOT, file_id);

    if (originalname.split(".").at(-1) !== "xlsx") {
      throw new Error("엑셀 파일이 아닙니다");
    }

    const MAX_FILE_SIZE = 1024 * 1024 * 3;
    if (size > MAX_FILE_SIZE) {
      throw new Error("최대 3MB 까지 가능합니다.");
    }

    const workBook = XLSX.readFile(dirPath, {
      type: "binary",
      cellDates: true,
      cellNF: false,
      cellText: false,
    });
    if (workBook.SheetNames.length !== 3) {
      throw new Error("포맷이 틀립니다 보고서, 보고서항목 으로 구성해주세요");
    }

    const data = headerFilter(workBook.Sheets[workBook.SheetNames[1]]);
    const column = headerFilter(workBook.Sheets[workBook.SheetNames[2]]);

    const user = users;

    const col = client.db("dp").collection("standard");
    const [categories] = await col
      .aggregate([
        { $match: { _id: "report_category" } },
        { $group: { _id: "$children.value" } },
      ])
      .toArray();

    const [codes] = await col
      .aggregate([
        { $match: { _id: "affiliate" } },
        { $group: { _id: "$children.value" } },
      ])
      .toArray();

    const options = {
      categories: categories._id.filter((e) => !!e),
      codes: codes._id.filter((e) => !!e),
      user,
    };

    const {
      data: result,
      err_cnt,
      empty_cnt,
    } = fileValidate2(reportConfig, data, options);
    const { data: column_data } = fileValidate2(
      reportColumnConfig,
      column,
      options,
    );

    const sendData = {
      file_name: originalname,
      file_id: name,
      data: result,
      column_data,
      err_cnt,
      empty_cnt,
    };

    res.status(200).json({ data: sendData });
  } catch (err) {
    console.error(err);
  }
}

async function ReportDataUpdateFile(file_id, req, res) {
  try {
    const db = client.db("dp");
    const collection = db.collection("dpasset");
    let dirPath = path.join(FILE_ROOT, "tmp", file_id);

    let data = "file empty";

    const workBook = XLSX.readFile(dirPath, {
      type: "binary",
      cellDates: true,
      cellNF: false,
      cellText: false,
    });

    if (workBook.SheetNames.length !== 3) {
      throw new Error(
        "포맷이 틀립니다 시트1(가이드), 시트1(보고서정의서), 시트3(항목정의서) 으로 구성해주세요",
      );
    }

    data = XLSX.utils.sheet_to_json(workBook.Sheets[workBook.SheetNames[1]], {
      dateNF: "yyyy-mm-dd hh:mm:ss",
      header: 1,
      raw: false,
      blankrows: false,
    });
    let column = XLSX.utils.sheet_to_json(
      workBook.Sheets[workBook.SheetNames[2]],
      {
        dateNF: "yyyy-mm-dd hh:mm:ss",
        header: 1,
        raw: false,
        blankrows: false,
      },
    );

    const refer = await collection
      .aggregate([
        { $match: { asset_type: "report" } },
        { $project: { _id: 1 } },
        { $project: { _id: { $objectToArray: "$$ROOT" } } },
        { $unwind: "$_id" },
        { $group: { _id: "$_id.v" } },
      ])
      .toArray();

    const options = {
      refer: refer.map((e) => e._id),
    };

    console.log(options);
    // data, column 따로 적용 후 합치기

    let result = await DataReportUploadCheck(data, column, "insert");
    const date = new moment().toDate();
    for (let item of result) {
      if (item._type) {
      } else {
        //있는지 확인
        let ckobj = await collection.findOne({ _id: item._id });
        if (ckobj) {
          //있으면
          item["updated"] = date;
          // await collection.updateOne({_id : item._id},{$set : item});
        } else {
          //없으면
          item["registered"] = date;
          // await collection.insertOne(item);
        }
      }
    }

    console.log(result);
    for (let item of result) {
      if (item._type) {
        // await collection.updateOne({_id : item._id},{$set : {
        //     child_tags:item.child_tags,
        //     child_names:item.child_names,
        //     child_descs:item.child_descs
        //   }});
      }
    }

    res.status(200).send("SUCCESS");
  } catch (err) {
    console.error(err);
  }
}

module.exports = { DataReportUpload, ReportDataUpdateFile };
