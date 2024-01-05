const path = require("path");
const XLSX = require("xlsx");
const moment = require("moment");
const { Validator } = require("../common/utils/validate/validator");
const { users } = require("../common/utils/data/users");
const { client } = require("../config/mongo");
const {
  reportConfig,
} = require("../common/utils/validate/config/report.config");
const fs = require("fs");
// const {
//   reportColumnConfig,
// } = require("../common/utils/validate/config/report_column.config");;
require("dotenv").config();

const { FILE_ROOT } = process.env;

const {
  excelValidate: reportValidate,
  headerFilter,
  insertData: insertReport,
} = new Validator(reportConfig);
// const { excelValidate: reportColumnValidate, insertData: insertReportColumn } = new Validator(reportColumnConfig);

const db = client.db("dp");

const ASSET_TYPE = "report";

const DataReportUpload = async (req, res) => {
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

    if (workBook.SheetNames.length !== 3) {
      throw new Error("포맷이 틀립니다 보고서, 보고서항목 으로 구성해주세요");
    }

    const data = headerFilter(workBook.Sheets[workBook.SheetNames[1]]);
    // const column = headerFilter(workBook.Sheets[workBook.SheetNames[2]]);

    const user = users;

    const Standard = db.collection("standard");
    const [categories] = await Standard.aggregate([
      { $match: { _id: "report_category" } },
      { $group: { _id: "$children.value" } },
    ]).toArray();

    const [codes] = await Standard.aggregate([
      { $match: { _id: "affiliate" } },
      { $group: { _id: "$children.value" } },
    ]).toArray();

    // 중복 확인용 데이터
    const Dpasset = db.collection("dpasset");
    const refer = await Dpasset.aggregate([
      { $match: { asset_type: ASSET_TYPE } },
      { $project: { _id: 1 } },
      { $project: { _id: { $objectToArray: "$$ROOT" } } },
      { $unwind: "$_id" },
      { $group: { _id: "$_id.v" } },
    ]).toArray();

    const options = {
      categories: categories._id.filter((e) => !!e),
      codes: codes._id.filter((e) => !!e),
      refer: refer.map((e) => e._id),
      user,
    };

    options.asset_type = ASSET_TYPE;
    const { data: result, err_cnt, empty_cnt } = reportValidate(data, options);

    options.asset_type = `${ASSET_TYPE}_column`;
    // const { data: column_data } = reportColumnValidate(column, options);

    const sendData = {
      file_name: originalname,
      file_id: name,
      data: result,
      // column_data,
      err_cnt,
      empty_cnt,
    };

    res.status(200).json({ data: sendData });
  } catch (err) {
    console.error(err);
  }
};

const ReportDataUpdateFile = async (req, res) => {
  try {
    const { file_id } = req.body;

    const Dpasset = db.collection("dpasset");

    await insertReport(file_id, Dpasset);

    res.status(200).send("SUCCESS");
  } catch (err) {
    console.error(err);
  }
};

const DataInterfaceUpload = async (req, res) => {
  try {
    let FileData = loopback.models["FileData"];
    const fileRoot = loopback.dataSources.fileData.settings.root;
    let dirPath = path.join(fileRoot, "tmp");
    if (!fs.existsSync(dirPath, { recursive: true })) {
      fs.mkdirSync(dirPath);
    }
    let re = await FileData.fileUpload("tmp", req, res);
    logger.info(fileRoot);
    // logger.info(JSON.stringify(re));
    if (re.files.file[0].originalFilename.split(".").pop() != "xlsx") {
      throw new Error("엑셀 파일이 아닙니다");
    } else {
      let fileKey;
      let fileInfo;
      let result;
      fileKey = Object.keys(re.files)[0];
      fileInfo = re.files[fileKey][0];
      let excelPath = path.join(fileRoot, fileInfo.container, fileInfo.name);

      if (global.drmUse) {
        let drm_excelPath = path.join(
          fileRoot,
          fileInfo.container,
          "extract_" + fileInfo.name,
        );

        let drmResult = await drm.extract(excelPath, drm_excelPath);
        logger.info(drmResult);
        if (drmResult.result) {
          excelPath = drmResult.stdout.split(",")[1];
        } else {
          throw new Error(
            drmResult.stderr
              ? drmResult.stderr
              : "DRM 복호화에 실패 하였습니다.",
          );
        }
      }

      const workBook = XLSX.readFile(excelPath, {
        type: "binary",
        cellDates: true,
        cellNF: false,
        cellText: true,
      });
      if (workBook.SheetNames.length != 2) {
        throw new Error("포맷이 틀립니다 인터페이스, 항목 으로 구성해주세요");
      } else {
        let data = XLSX.utils.sheet_to_json(
          workBook.Sheets[workBook.SheetNames[0]],
          {
            header: 1,
            raw: false,
            blankrows: false,
          },
        );
        let column = XLSX.utils.sheet_to_json(
          workBook.Sheets[workBook.SheetNames[1]],
          {
            header: 1,
            raw: false,
            blankrows: false,
          },
        );

        result = await DataInterfaceUploadCheck(data, column, "validate");
      }
      return {
        file_name: fileInfo.originalFilename,
        file_id: fileInfo.name,
        data: result.data,
        column_data: result.column,
        warn_cnt: result.warn_cnt,
        err_cnt: result.err_cnt,
        empty_cnt: result.empty_cnt,
      };
    }
  } catch (err) {
    throw new Error(err);
  }
};

const InterfaceDataUpdateFile = async (req, res) => {
  try {
    const db = loopback.mongoClient.db("dp");
    const collection = db.collection("dpasset");
    const fileRoot = loopback.dataSources.fileData.settings.root;
    let user_id = req.token_info.USER_ID;
    let dirPath = path.join(fileRoot, "tmp", file_id);

    let data = "file empty";

    if (global.drmUse) {
      let drm_excelPath = path.join(fileRoot, "tmp", "extract_" + file_id);

      let drmResult = await drm.extract(dirPath, drm_excelPath);
      logger.info(drmResult);
      if (drmResult.result) {
        dirPath = drmResult.stdout.split(",")[1];
      } else {
        throw new Error(
          drmResult.stderr ? drmResult.stderr : "DRM 복호화에 실패 하였습니다.",
        );
      }
    }

    // const workBook = XLSX.readFile(dirPath, {type : 'binary', cellDates : true , cellNF :  false , cellText : false});
    const workBook = XLSX.readFile(dirPath, {
      type: "binary",
      cellDates: true,
      cellNF: false,
      cellText: true,
    });
    logger.info(workBook.SheetNames);
    if (workBook.SheetNames.length != 2) {
      throw new Error(
        "포맷이 틀립니다 시트1(인터페이스), 시트2(항목) 으로 구성해주세요",
      );
    } else {
      data = XLSX.utils.sheet_to_json(workBook.Sheets[workBook.SheetNames[0]], {
        header: 1,
        raw: false,
        blankrows: false,
      });
      let column = XLSX.utils.sheet_to_json(
        workBook.Sheets[workBook.SheetNames[1]],
        {
          header: 1,
          raw: false,
          blankrows: false,
        },
      );

      let result = await DataInterfaceUploadCheck(data, column, "insert");
      // insert:inserts, childs_obj:childs_obj
      const date = new moment();
      let table_system_obj = result.table_system_obj;
      // let oracle_interface_insert = [];
      // let oracle_interface_column_insert = [];
      for (let item of result.insert) {
        //있는지 확인
        item["childs"] = result.childs_obj[item.dataset_id]
          ? result.childs_obj[item.dataset_id]
          : [];
        let ckobj = await collection.findOne({ _id: item._id });
        if (ckobj) {
          //있으면 수정
          item["updated"] = date.toDate();
          // if((item.table_dataset_ids && item.table_dataset_ids.length > 0) || item.file_name){
          /*if(item.table_dataset_ids && item.table_dataset_ids.length > 0){
                                          if(item.table_dataset_ids && item.table_dataset_ids.length > 0){
                                            item.table_dataset_ids.forEach(function(table_dataset_id){
                                              let inert_if_obj = NewCatalog.setOracleInterIf(item, table_dataset_id, table_system_obj);
                                              inert_if_obj['UPD_GBN']='MOD';
                                              inert_if_obj['AVAL_ST_DT']=date.tz('Asia/Seoul').format("YYYYMMDDHHmmss");
                                              inert_if_obj['AVAL_END_DT']='99991231235959';
                                              if(inert_if_obj.TBL_NM){
                                                oracle_interface_insert.push(inert_if_obj);
                                              }
                                            });
                                          }else{
                                            let inert_if_obj = NewCatalog.setOracleInterIf(item, null, null);
                                            inert_if_obj['UPD_GBN']='MOD';
                                            inert_if_obj['AVAL_ST_DT']=date.tz('Asia/Seoul').format("YYYYMMDDHHmmss");
                                            inert_if_obj['AVAL_END_DT']='99991231235959';
                                            if(inert_if_obj.TBL_NM){
                                              oracle_interface_insert.push(inert_if_obj);
                                            }
                                          }
                                          item.childs.forEach(function(child){
                                            let inert_if_detail_obj = NewCatalog.setOracleInterIfDetail(child);
                                            inert_if_detail_obj['UPD_GBN']='MOD';
                                            inert_if_detail_obj['AVAL_ST_DT']=date.tz('Asia/Seoul').format("YYYYMMDDHHmmss");
                                            inert_if_detail_obj['AVAL_END_DT']='99991231235959';
                                            oracle_interface_column_insert.push(inert_if_detail_obj);
                                          });
                                        }*/
          await collection.updateOne({ _id: item._id }, { $set: item });
        } else {
          //없으면 추가
          item["registered"] = date.toDate();
          // if((item.table_dataset_ids && item.table_dataset_ids.length > 0) || item.file_name){
          /*if(item.table_dataset_ids && item.table_dataset_ids.length > 0){
                                          if(item.table_dataset_ids && item.table_dataset_ids.length > 0){
                                            item.table_dataset_ids.forEach(function(table_dataset_id){
                                              let inert_if_obj = NewCatalog.setOracleInterIf(item, table_dataset_id, table_system_obj);
                                              inert_if_obj['UPD_GBN']='ADD';
                                              inert_if_obj['AVAL_ST_DT']=date.tz('Asia/Seoul').format("YYYYMMDDHHmmss");
                                              inert_if_obj['AVAL_END_DT']='99991231235959';
                                              if(inert_if_obj.TBL_NM){
                                                oracle_interface_insert.push(inert_if_obj);
                                              }
                                            });
                                          }else{
                                            let inert_if_obj = NewCatalog.setOracleInterIf(item, null, null);
                                            inert_if_obj['UPD_GBN']='ADD';
                                            inert_if_obj['AVAL_ST_DT']=date.tz('Asia/Seoul').format("YYYYMMDDHHmmss");
                                            inert_if_obj['AVAL_END_DT']='99991231235959';
                                            if(inert_if_obj.TBL_NM){
                                              oracle_interface_insert.push(inert_if_obj);
                                            }
                                          }
                                          item.childs.forEach(function(child){
                                            let inert_if_detail_obj = NewCatalog.setOracleInterIfDetail(child);
                                            inert_if_detail_obj['UPD_GBN']='ADD';
                                            inert_if_detail_obj['AVAL_ST_DT']=date.tz('Asia/Seoul').format("YYYYMMDDHHmmss");
                                            inert_if_detail_obj['AVAL_END_DT']='99991231235959';
                                            oracle_interface_column_insert.push(inert_if_detail_obj);
                                          });
                                        }*/
          await collection.insertOne(item);
        }
      }
      // console.log(oracle_interface_insert);
      // console.log(oracle_interface_column_insert);
      /*for(let insert of oracle_interface_insert){
                          let insert_query = mybatisMapper.getStatement('interface', 'setDF_EXTRN_INF', insert);
                          await oracle.excute(insert_query);
                        }
                        for(let insert_detail of oracle_interface_column_insert){
                          let insert_detailquery = mybatisMapper.getStatement('interface', 'setDF_EXTRN_INF_DET', insert_detail);
                          await oracle.excute(insert_detailquery);
                        }
                        if(oracle_interface_insert.length > 0 || oracle_interface_column_insert.length > 0){
                          let apply_query = mybatisMapper.getStatement('interface', 'DF_APPLY_EXTRN_INF');
                          await oracle.excute(apply_query);
                        }*/
      await NewCatalog.InterfaceSync(req, res);
      return "SUCCESS";
    }
  } catch (err) {
    throw new Error(err);
  }
};

module.exports = {
  DataReportUpload,
  ReportDataUpdateFile,
  DataInterfaceUpload,
  InterfaceDataUpdateFile,
};
