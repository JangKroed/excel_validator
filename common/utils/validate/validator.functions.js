// const { client } = require("./mongo");
//
// const database = client.db("dp");

const validateHandler = {
  none,
  id,
  select,
  range,
  // db,
  regex,
};

/**
 * 필드 공백 및 괄호문자열 제거
 */
const fieldConvertor = (str) =>
  str.replace(/\s/g, "").replace(/\([^)]*\)/g, "");

/**
 * null error message
 */
const IS_NOT_NULL_MESSAGE = (field) =>
  `[${fieldConvertor(field)}] 필수 입력값입니다.`;

/**
 * 유효성 검사 실패 메세지
 */
const INVALID_VALUE = (field, value) =>
  `${fieldConvertor(field)}[${value}] 잘못된 입력값입니다.`;

const messageHandler = {
  invalid: INVALID_VALUE,
  empty: IS_NOT_NULL_MESSAGE,
};

/**
 * create error object
 */
const err = (key, data, type) => {
  return {
    type,
    msg: messageHandler[type](fieldConvertor(key), data),
  };
};

/**
 * none type validate
 */
function none(_, data) {
  return [null, data];
}

/**
 * id type validate
 */
function id(_, data) {
  if (!data) {
    data = "ID값이 null일 경우 할당되어야 합니다.";
  }

  return [null, data];
}

/**
 * required validate
 */
function requireValidate(key, data, required) {
  if (required && !data.toString().trim()) {
    return [err(key, data, "empty"), data];
  }

  return null;
}

/**
 * select type validate
 */
function select(key, data, config, option = {}) {
  if (!data) {
    return [null, data];
  }

  const { checkObj } = config;

  if (typeof checkObj === "string") {
    if (!option[checkObj]) {
      throw new Error(`${key}: ${data} - ${checkObj} is option invalid!})`);
    }

    if (Array.isArray(option[checkObj])) {
      if (option[checkObj].includes(data)) {
        return [null, data];
      } else {
        return [err(key, data, "invalid"), data];
      }
    }

    if (!option[checkObj][data.trim()]) {
      return [err(key, data, "invalid"), data];
    } else {
      return [null, data];
    }
  }

  if (!checkObj[data.trim()]) {
    return [err(key, data, "invalid"), data];
  }

  return [null, data];
}

/**
 * range type validate
 */
function range(key, data = 0, config) {
  const { start, end } = config.checkObj;

  const target = Number(data);

  if (!!data && (isNaN(target) || !(start <= target && target <= end))) {
    return [err(key, data, "invalid"), data];
  }

  return [null, data];
}

/**
 * db type validate
 */
// async function db(key, data, config) {
//     const { dbType, collection, findKey } = config.checkObj;
//
//     if (!!data.toString().trim() && dbType === "mongo") {
//         const result = await database
//             .collection(collection)
//             .findOne({ [findKey]: data });
//
//         if (!result) {
//             return [err(key, data, "invalid"), data];
//         }
//     }
//
//     return [null, data];
// }

/**
 * regex type validate
 */
function regex(key, data, config) {
  data = data.replace(/\r|\n| /g, "");
  if (!!data.toString().trim() && !config.regex.test(data)) {
    return [err(key, data, "invalid"), data];
  }

  return [null, data];
}

module.exports = { validateHandler, fieldConvertor, requireValidate };
