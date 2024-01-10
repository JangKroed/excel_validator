const path = require("path");
const XLSX = require("xlsx");
const moment = require("moment");
const fs = require("fs");
const { client } = require("../config/mongo");
const { users } = require("../data/users");
const {
  Validator,
  isInvaliedFile,
  headerFilter,
} = require("../packages/validator");
const {
  reportConfig,
  interfaceConfig,
} = require("../common/utils/validateConfigs");
require("dotenv").config();

const { FILE_ROOT } = process.env;

const reportValidator = new Validator(reportConfig);
const interfaceValidator = new Validator(interfaceConfig);

const db = client.db("dp");

const ASSET_TYPE = "report";

// report
const DataReportUpload = async (req, res) => {
  try {
    const { originalname, filename: name } = isInvaliedFile(req.file);

    let excelPath = path.join(`${FILE_ROOT}/tmp`, name);

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

    const user = await db.collection("usr_user").find().toArray();

    // 중복 확인용 데이터
    const DpassetReport = db.collection("dpasset_report");
    const refer = await DpassetReport.aggregate([
      { $match: { asset_type: ASSET_TYPE } },
      { $project: { _id: 1 } },
    ]).toArray();
    const Dpasset = db.collection("dpasset");
    const table = await Dpasset.aggregate([
      { $match: { asset_type: "table" } },
      {
        $project: { instance_name: 1, schema_name: 1, name: 1, dataset_id: 1 },
      },
    ]).toArray();

    const options = {
      user,
      table,
      refer: refer.map((e) => e._id),
      asset_type: ASSET_TYPE,
    };

    const {
      data: result,
      err_cnt,
      empty_cnt,
    } = reportValidator.validation(data, options);

    const sendData = {
      file_name: originalname,
      file_id: name,
      data: result,
      err_cnt,
      empty_cnt,
    };

    res.status(200).json({ data: sendData });
  } catch (err) {
    res.status(400).json({ err });
  }
};

const ReportDataUpdateFile = async (req, res) => {
  try {
    const { file_id } = req.body;

    const DpassetReport = db.collection("dpasset_report");

    await reportValidator.insertData(file_id, DpassetReport);

    res.status(200).send("SUCCESS");
  } catch (err) {
    res.status(400).json({ err });
  }
};

///////////////////////////////////////////////////////////////////////////////
//                                 interface
///////////////////////////////////////////////////////////////////////////////

const DataInterfaceUpload = async (req, res) => {
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
      throw new Error("포맷이 틀립니다 인터페이스, 항목 으로 구성해주세요");
      // return Promise.reject("포맷이 틀립니다 인터페이스, 항목 으로 구성해주세요");
    }

    let data = headerFilter(workBook.Sheets[workBook.SheetNames[0]]);
    // let column = headerFilter(workBook.Sheets[workBook.SheetNames[1]]);

    const Dpasset = db.collection("dpasset");
    const refer = await Dpasset.aggregate([
      { $match: { asset_type: "interface" } },
      { $project: { _id: 1 } },
      { $project: { _id: { $objectToArray: "$$ROOT" } } },
      { $unwind: "$_id" },
      { $group: { _id: "$_id.v" } },
    ]).toArray();

    const options = {
      refer: refer.map((e) => e._id),
      user: users,
    };

    options.asset_type = "interface";
    const {
      data: resultData,
      err_cnt,
      empty_cnt,
    } = interfaceValidator.validation(data, options);
    // const { column_data } = interfaceColumnValidate(column, options);

    const sendData = {
      file_name: originalname,
      file_id: name,
      data: resultData,
      // column_data,
      // warn_cnt: warn_cnt,
      err_cnt,
      empty_cnt,
    };

    res.status(200).json({ data: sendData });
  } catch (err) {
    res.status(400).json({ err });
  }
};

const InterfaceDataUpdateFile = async (req, res) => {
  try {
    throw new Error("개발중입니다.");

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
      // await NewCatalog.InterfaceSync(req, res);
      res.redirect("../InterfaceSync");
    }
  } catch (err) {
    res.status(400).json({ err });
  }
};

const InterfaceSync = async (req, res) => {
  try {
    const db = loopback.mongoClient.db("dp");
    const collection = db.collection("dpasset");
    const cursor = await collection.aggregate(
      [
        {
          $match: {
            asset_type: "interface",
            file_name: { $nin: [null, ""] },
            "tb_dataset_ids.0": { $exists: true },
          },
        },
        { $unwind: { path: "$tb_dataset_ids" } },
        {
          $lookup: {
            from: "dpasset",
            let: { tb_dataset_ids: "$tb_dataset_ids" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$dataset_id", "$$tb_dataset_ids"] },
                  asset_type: "table",
                },
              },
            ],
            as: "dataset",
          },
        },
        { $match: { "dataset.0": { $exists: true } } },
      ],
      { allowDiskUse: true },
    ); // find all

    let truncate_sql = "TRUNCATE TABLE DF_EXTRN_INF_T";
    let truncate_result = await oracle.excutePostgre(truncate_sql);
    truncate_sql = "TRUNCATE TABLE DF_EXTRN_INF_DET_T";
    truncate_result = await oracle.excutePostgre(truncate_sql);
    let cnt = 0;
    while (await cursor.hasNext()) {
      // Iterate entire data
      let item = await cursor.next(); // Get 1
      let inert_if_obj = NewCatalog.setOracleInterIf(item, null, null);
      inert_if_obj["TBL_INST_NM"] = item.dataset[0].instance_name
        ? item.dataset[0].instance_name
        : "";
      inert_if_obj["SYS_NM"] = item.dataset[0].source_system_lv1
        ? item.dataset[0].source_system_lv1
        : "";
      inert_if_obj["SCHEMA_NM"] = item.dataset[0].schema_name
        ? item.dataset[0].schema_name
        : "";
      inert_if_obj["TBL_NM"] = item.dataset[0].name ? item.dataset[0].name : "";
      if (
        inert_if_obj.CAT &&
        inert_if_obj.SCHEMA_NM &&
        inert_if_obj.TBL_NM &&
        inert_if_obj.SR_GBN &&
        inert_if_obj.ITF_FILE_NM &&
        inert_if_obj.LIVE_DEL_GBN &&
        inert_if_obj.ITF_NM &&
        inert_if_obj.ITF_ID
      ) {
        //insert
        let insert_query = mybatisMapper.getStatement(
          "interface",
          "setDF_EXTRN_INF",
          inert_if_obj,
        );
        await oracle.excutePostgre(insert_query);
        cnt++;
        for (let child of item.childs) {
          let inert_if_detail_obj = NewCatalog.setOracleInterIfDetail(child);
          if (
            inert_if_detail_obj.SRC_TBL_NM &&
            inert_if_detail_obj.SRC_NO &&
            inert_if_detail_obj.TGT_ENG_NM &&
            inert_if_detail_obj.TGT_KOR_NM &&
            inert_if_detail_obj.TGT_TBL_NM &&
            inert_if_detail_obj.INF_ID &&
            inert_if_detail_obj.SRC_ENG_NM &&
            inert_if_detail_obj.SRC_KOR_NM
          ) {
            //insert
            let insert_detailquery = mybatisMapper.getStatement(
              "interface",
              "setDF_EXTRN_INF_DET",
              inert_if_detail_obj,
            );
            await oracle.excutePostgre(insert_detailquery);
          }
        }
      }
    }
    if (cnt > 0) {
      let apply_query = mybatisMapper.getStatement(
        "interface",
        "DF_APPLY_EXTRN_INF",
      );
      await oracle.excutePostgre(apply_query);
    }

    res.status(200).send("SUCCESS");
  } catch (err) {
    throw new Error(err);
  }
};

module.exports = {
  DataReportUpload,
  ReportDataUpdateFile,
  DataInterfaceUpload,
  InterfaceDataUpdateFile,
  InterfaceSync,
};
