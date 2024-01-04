const {
  validateHandler,
  fieldConvertor,
  requireValidate,
} = require("./functions");

/**
 * @typedef {Object} Config
 * @property {'none' | 'id' | 'select' | 'range' | 'db' | 'regex'} type 타입종류
 * @property {boolean} required 필수여부
 * @property {boolean} [unique] 유일여부
 * @property {regex} [regex] 정규식
 * @property {Object.<string, string | number>} [checkObj] 검사할 데이터
 */

/**
 * config, sheet field match check
 * @param {{[key: string]: Config}} config 설정
 * @param {WorkSheet} sheet
 * @returns {boolean}
 */
function fieldValidation(config, sheet) {
  // 키값이 서로 다를수 있으니 키값을 공백 및 괄호문자 삭제 후 대조하는 작업으로 구성
  const sheetFields = Object.keys(sheet[0]).map(fieldConvertor);
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

  // const sheetFields = Object.keys(sheet[0]);
  // for (const field of sheetFields) {
  //   if (!config[fieldConvertor(field)]) {
  //     return false;
  //   }
  // }

  return true;
}

/**
 * 유효성 검사
 * @param {{[key: string]: Config}} config 설정
 * @param {WorkSheet} sheet 시트데이터
 * @param {{[key:string]: string | number}} option
 * @returns {Promise<{result: *[], empty_cnt: number, err_cnt: number}> | {result: *[], empty_cnt: number, err_cnt: number}}
 */
async function validate(config, sheet, option = {}) {
  const hasFields = fieldValidation(config, sheet);
  if (!hasFields) {
    throw new Error("업로드 양식이 아닙니다. 컬럼정보를 확인해주세요.");
  }

  // TODO - unique hash table setting
  const uniqueTable = {};

  let err_cnt = 0;
  let empty_cnt = 0;

  const result = [];

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

      const [err, resultData] = await validateHandler[fieldType](
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

  return { result, err_cnt, empty_cnt };
}

module.exports = {
  validate,
  reportConfig: require("./report.js"),
};
