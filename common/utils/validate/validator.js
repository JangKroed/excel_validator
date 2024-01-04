const {
  validateHandler,
  fieldConvertor,
  requireValidate,
} = require("./validator.functions");
// const {businessGlossaryConfig} = require("./config/businessGlossary.config");
const { ObjectID } = require("mongodb");
const moment = require("moment");
const XLSX = require("xlsx");

class Validator {
  constructor(config) {
    this.config = config;
    this.tempData = {};
  }

  excelValidate(config, sheet, options = {}) {}

  async insertData(fileId, col) {
    /**
     * TODO !!
     * this.tempData[fileId]의 데이터를 bulkWrite
     * 리턴값이 정상이라면 delete this.tempData[fileId]
     * 실패시 에러
     */

    try {
      const items = this.tempData[fileId];

      await this._mongoBulkUpsert(col, items);
    } catch (err) {
      console.error(err);
    }
  }

  async _mongoBulkUpsert(col, items) {
    const bulkUpdateOps = [];
    for (const item of items) {
      bulkUpdateOps.push({
        updateOne: {
          filter: { _id: item._id },
          update: { $set: { ...item } },
          upsert: true,
        },
      });
    }

    await col.bulkWrite(bulkUpdateOps).catch(console.error);
    return "success";
  }

  headerFilter(workSheet) {
    let data = XLSX.utils.sheet_to_json(workSheet, {
      defval: "",
      dateNF: "yyyy-mm-dd hh:mm:ss",
      header: 1,
      raw: false,
      blankrows: false,
    });

    let isEmpty = false;

    for (const row of data[0]) {
      if (!row) {
        isEmpty = true;
        break;
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

      const newObjKeys = objKeys.map(this._fieldConvertor);

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
        dateNF: "yyyy-mm-dd hh:mm:ss",
        raw: false,
        blankrows: false,
      });
    }
  }

  _fieldValidation(config, sheet) {
    const sheetFields = Object.keys(sheet[0]).map(this._fieldConvertor);
    const tempObj = {};
    for (const field of sheetFields) {
      tempObj[field] = 1;
    }

    const configFields = Object.keys(config);

    for (const field of configFields) {
      if (!tempObj[field]) {
        return false;
      }
    }

    return true;
  }

  _fieldConvertor = (str) => str.replace(/\s/g, "").replace(/\([^)]*\)/g, "");

  _modifyingName = (str) => str.replace(/\s/g, "").replace(/\([^)]*\)/g, "");
}

/**
 * config, sheet field match check
 */

/**
 * 공백, 괄호, \s 제거
 */
const modifyingName = (str) => str.replace(/\s/g, "").replace(/\([^)]*\)/g, "");

/**
 * 유효성 검사
 */
function fileValidate2(config, sheet, option = {}) {
  const hasFields = fieldValidation(config, sheet);
  if (!hasFields) {
    throw new Error("업로드 양식이 아닙니다. 컬럼정보를 확인해주세요.");
  }

  // TODO - unique hash table setting
  const uniqueTable = {};

  let err_cnt = 0;
  let empty_cnt = 0;

  const result = new Array(2);
  result[0] = ["검증결과", ...Object.keys(sheet[0]).map(modifyingName)];
  result[1] = ["결과", ...Object.keys(sheet[0])];

  const errorHandler = {
    invalid: () => err_cnt++,
    empty: () => empty_cnt++,
  };

  // 각 데이터를 순회하며 데이터 검증
  for (const row of sheet) {
    const temp = [[]];

    for (const key in row) {
      const [msg] = temp;

      const field = fieldConvertor(key);
      const fieldType = config[field].type || "none";

      if (!!row[key] && config[field].unique === true) {
        if (uniqueTable[field] && uniqueTable[field][row[key]]) {
          temp.push(row[key]);
          msg.push(`${field}[${row[key]}] 중복되지 않아야 하는 데이터 입니다.`);
          errorHandler.invalid();
          continue;
        }

        if (!uniqueTable[field]) {
          uniqueTable[field] = { [row[key]]: 1 };
        } else {
          uniqueTable[field][row[key]] = 1;
        }
      }

      const isEmpty = requireValidate(field, row[key], config[field].required);
      if (isEmpty) {
        temp.push(isEmpty[1]);
        msg.push(isEmpty[0].msg);
        errorHandler[isEmpty[0].type]();
        continue;
      }

      const [err, resultData] = validateHandler[fieldType](
        key,
        row[key],
        config[field],
        option,
      );

      temp.push(resultData);

      if (!!err) {
        msg.push(err.msg);
        errorHandler[err.type]();
      }
    }

    result.push(temp);
  }

  return { data: result, err_cnt, empty_cnt };
}

function excelDataProcessing(config, sheet, option) {
  const { token_info, refer, asset_type } = option;

  const dataList = [];
  const tempList = [];

  const date = new moment().toDate();
  const { USER_ID, USER_NM, DEPT_ID, DEPT_NM } = token_info;
  for (const row of sheet) {
    /**
     * TODO - term 변수 이름 data로 변경
     * asset_type은 인자로 받아 적용
     * asset_type별 id 생성로직 변경
     * asset_type이 dp_term일때 histories 생성후 return { terms: data, histories }
     */

    const data = {
      asset_type: asset_type,
      status: "검토완료",
    };

    // TODO - term부터 완성 시킨다
    for (const key in row) {
      const configKey = modifyingName(key);

      if (key === "ID") {
        continue;
      }

      // if (typeof row[key] === 'string') {
      //     row[key] = row[key].replace(/[\n\r]/g, '')
      // }

      const stringSplit = row[key].split(",");

      switch (config[configKey].dataType) {
        case "string":
          data[config[configKey].column] = row[key] || "";
          break;
        case "user":
          const [deptId, deptName, userId, username] =
            config[configKey].column.split(",");

          if (!row[key].length) {
            data[deptId] = "";
            data[deptName] = "";
            data[userId] = "";
            data[username] = "";
          } else {
            data[deptId] = option.user[row[key]].DEPT_ID;
            data[deptName] = option.user[row[key]].DEPT_NM;
            data[userId] = option.user[row[key]].USER_ID;
            data[username] = option.user[row[key]].USER_NM;
          }
          break;
        case "array":
          if (configKey === "테이블정보") {
            const [tb_ids, col_ids] = config[configKey].column.split(",");
            const ids = row[key].split(",");
            data[tb_ids] = ids;

            if (!!col_ids) {
              data[col_ids] = ids.map((item) => {
                return {
                  dataset_id: item,
                  col_name: item.split(".").at(-1),
                };
              });
            }
          } else {
            data[config[configKey].column] = !row[key] ? [] : stringSplit;
          }
          break;
        default:
          throw new Error("유효하지 않은 타입입니다.");
      }
    }

    switch (asset_type) {
      case "dp_term":
        // TODO - row.ID 있는지 확인 후 로직 추가 필요
        // new 필드는 _id가 있으면 'N', 없으면 'Y'로 할당 후
        // _id를 uuid() 또는 new ObjectId().toString() 할당
        if (!row.ID) {
          row.ID = new ObjectID().toString();
        }

        // TODO - histories -> tempArray 변경 후 비즈용어 타입일때 생성 후 리턴
        const history = {
          user_id: USER_ID,
          user_nm: USER_NM,
          dept_id: DEPT_ID,
          dept_nm: DEPT_NM,
          event_time: date,
        };
        if (!refer.includes(row.ID)) {
          // dpasset.asset_type = 'dp_data' 데이터에 없는경우
          data.resistered = date;
          history.event = "add";
        } else {
          data.updated = date;
          history.event = "mod";
        }

        data._id = row.ID;
        data.dataset_id = row.ID;
        history._id = row.ID;
        history.item = data;

        dataList.push(data);
        tempList.push(history);
        break;
      case "report":
        data._id = "REPORT." + data._id;
        tempList.push(data._id);
        break;
      case "report_column":
        delete data.status;
        break;
      case "interface":
        break;
      default:
        throw new Error("유효하지 않은 타입입니다.");
    }
  }

  switch (asset_type) {
    case "dp_term":
      console.log("histories", tempList);
      throw new Error("sdfasdfasdfasdf");
      return { terms: dataList, histories: tempList };
    case "report":
      return { data: dataList, report_ids: tempList };
    case "report_column":
    case "interface":
    default:
      throw new Error("유효하지 않은 타입입니다.");
  }
}

/**
 * 가로 병합된 헤더가 존재하는지 체크 및 데이터 가공
 */

module.exports = {
  fileValidate2,
  excelDataProcessing,
  Validator,
};
