const { ValidateHandler } = require("./validator.functions");
const { ObjectID } = require("mongodb");
const moment = require("moment");
const XLSX = require("xlsx");

class Validator extends ValidateHandler {
  constructor(config) {
    super();
    this.config = config;
    this.tempData = {};
    this.validateHandler = {
      none: this._none,
      id: this._id,
      select: this._select,
      range: this._range,
      regex: this._regex,
    };
  }

  /**
   * 유효한 필드인지 검증
   * @param config
   * @param sheet
   * @returns {boolean}
   * @private
   */
  _fieldValidation = (config, sheet) => {
    const sheetFields = Object.keys(sheet[0]).map(this.fieldConvertor);
    const tempObj = {};
    for (const field of sheetFields) {
      tempObj[field] = 1;
    }

    const configFields = Object.keys(config);

    console.log(sheetFields);
    console.log(configFields);

    for (const field of configFields) {
      if (!tempObj[field]) {
        return false;
      }
    }

    return true;
  };

  /**
   * 데이터 검증
   * @param sheet
   * @param options
   * @returns {{data: any[], empty_cnt: number, err_cnt: number}}
   */
  excelValidate = (sheet, options) => {
    const hasFields = this._fieldValidation(this.config, sheet);
    if (!hasFields) {
      throw new Error("업로드 양식이 아닙니다. 컬럼정보를 확인해주세요.");
    }

    const tempTable = [];
    const uniqueTable = {};

    let err_cnt = 0;
    let empty_cnt = 0;
    let warm_cnt = 0;

    const result = new Array(2);
    result[0] = ["검증결과", ...Object.keys(sheet[0]).map(this.fieldConvertor)];
    result[1] = ["결과", ...Object.keys(sheet[0])];

    const errorHandler = {
      invalid: () => err_cnt++,
      empty: () => empty_cnt++,
      warm: () => warm_cnt,
    };

    for (const row of sheet) {
      const temp = [[]];

      for (const key in row) {
        const [msg] = temp;

        const field = this.fieldConvertor(key);
        const fieldType = this.config[field].type || "none";

        // unique validation
        if (!!row[key] && this.config[field].unique === true) {
          if (uniqueTable[field] && uniqueTable[field][row[key]]) {
            temp.push(row[key]);
            msg.push(
              `${field}[${row[key]}] 중복되지 않아야 하는 데이터 입니다.`,
            );
            errorHandler.invalid();
            continue;
          }

          if (!uniqueTable[field]) {
            uniqueTable[field] = { [row[key]]: 1 };
          } else {
            uniqueTable[field][row[key]] = 1;
          }
        }

        // require validation
        const isEmpty = this.requireValidate(
          field,
          row[key],
          this.config[field].required,
        );
        if (isEmpty) {
          temp.push(isEmpty[1]);
          msg.push(isEmpty[0].msg);
          errorHandler[isEmpty[0].type]();
          continue;
        }

        const [err, resultData] = this.validateHandler[fieldType](
          key,
          row[key],
          this.config[field],
          options,
        );

        temp.push(resultData);

        if (!!err) {
          msg.push(err.msg);
          errorHandler[err.type]();
        }
      }

      result.push(temp);

      // if (!err_cnt && !empty_cnt && !warm_cnt) {
      tempTable.push(this._excelDataProcessing(row, options));
      // }
    }

    // if (!err_cnt && !empty_cnt && !warm_cnt) {
    this.tempData[options.fileId] = tempTable;
    console.log(tempTable);
    // }

    return { data: result, err_cnt, empty_cnt };
  };

  /**
   * 데이터 저장
   * @param fileId
   * @param col
   * @returns {Promise<void>}
   */
  insertData = async (fileId, col) => {
    try {
      // const bulkUpdateOps = [];
      console.log("insert!", this.tempData[fileId][0]);
      delete this.tempData[fileId];
      // for (const item of this.tempData[fileId]) {
      //   bulkUpdateOps.push({
      //     updateOne: {
      //       filter: { _id: item._id },
      //       update: { $set: { ...item } },
      //       upsert: true,
      //     },
      //   });
      // }
      //
      // await col.bulkWrite(bulkUpdateOps);
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * 병합된 헤더가 존재하는지 체크 및 데이터 가공
   * @param workSheet
   * @returns {unknown[]|*[]}
   */
  headerFilter = (workSheet) => {
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

      const newObjKeys = objKeys.map(this.fieldConvertor);

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
  };

  /**
   * sheet.row를 MongoDB schema 형식으로 가공
   * @param row
   * @param options
   * @returns {{asset_type, status: string}}
   * @private
   */
  _excelDataProcessing(row, options) {
    const { refer, asset_type } = options;

    const dateTime = new moment().toDate();
    const data = {
      asset_type: asset_type,
      status: "검토완료",
    };

    for (const key in row) {
      const configKey = this.fieldConvertor(key);
      const config = this.config[configKey];

      if (config.column === "_id") {
        /**
         * _id가 없으면 new ObjectID().toString()
         * if (!config.refer) config.refer + row[key]
         * else
         */

        if (!row[key]) {
          row[key] = new ObjectID().toString();
        }

        if (!config.refer) {
          data._id = row[key];
        } else {
          data._id = config.refer + row[key];
          data.child_descs = "";
          data.child_names = "";
          data.child_tags = "";
        }

        data.dataset_id = row[key];

        if (!refer.includes(row[key])) {
          data.resistered = dateTime;
        } else {
          data.updated = dateTime;
        }

        continue;
      }

      const stringSplit = row[key].split(",");

      switch (config.dataType) {
        case "none":
          break;
        case "string":
          data[config.column] = row[key] || "";
          break;
        case "user":
          const [deptId, deptName, userId, username] = config.column.split(",");

          if (!row[key].length || !options.user[row[key]]) {
            data[deptId] = "";
            data[deptName] = "";
            data[userId] = "";
            data[username] = "";
          } else {
            data[deptId] = options.user[row[key]].DEPT_ID;
            data[deptName] = options.user[row[key]].DEPT_NM;
            data[userId] = options.user[row[key]].USER_ID;
            data[username] = options.user[row[key]].USER_NM;
          }
          break;
        case "array":
          data[config.column] = !row[key] ? [] : stringSplit;
          break;
        default:
          console.log(config.dataType);
          throw new Error("유효하지 않은 타입입니다.");
      }
    }

    return data;
  }
}

module.exports = {
  Validator,
};
