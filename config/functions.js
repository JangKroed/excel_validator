const { client } = require("./mongo");

const database = client.db("dp");

const validateHandler = {
  none,
  id,
  select,
  range,
  db,
  regex,
};

/**
 * 필드 공백 및 괄호문자열 제거
 * @param {string} str
 * @returns {string}
 */
const fieldConvertor = (str) =>
  str.replace(/\s/g, "").replace(/\([^)]*\)/g, "");

/**
 * null error message
 * @param {string} field
 * @returns {`[${string}] 필수 입력값입니다.`}
 */
const IS_NOT_NULL_MESSAGE = (field) =>
  `[${fieldConvertor(field)}] 필수 입력값입니다.`;

/**
 * 유효성 검사 실패 메세지
 * @param {string} field
 * @param {string | number} value
 * @returns {`${string}[${string}] 잘못된 입력값입니다.`}
 */
const INVALID_VALUE = (field, value) =>
  `${fieldConvertor(field)}[${value}] 잘못된 입력값입니다.`;

const messageHandler = {
  invalid: INVALID_VALUE,
  empty: IS_NOT_NULL_MESSAGE,
};

/**
 * create error object
 * @param {string} key
 * @param {string | number} data
 * @param {string} type
 * @returns {{msg: string, type: string}}
 */
const err = (key, data, type) => {
  return {
    type,
    msg: messageHandler[type](fieldConvertor(key), data),
  };
};

/**
 * none type validate
 * @param {string} _
 * @param {string} data
 * @returns {Array<null | string>}
 */
function none(_, data) {
  return [null, data];
}

/**
 * id type validate
 * @param {string} _
 * @param {string} data
 * @returns {Array<null | string>}
 */
function id(_, data) {
  if (!data) {
    data = "ID값이 null일 경우 할당되어야 합니다.";
  }

  return [null, data];
}

/**
 * required validate
 * @param {string} key
 * @param {string} data
 * @param {boolean} required
 * @returns {Array<null | {type: string, msg: string} | string>}
 */
function requireValidate(key, data, required) {
  if (required && !data.toString().trim()) {
    return [err(key, data, "empty"), data];
  }

  return null;
}

/**
 * @typedef {Object} Option
 * @property {Object.<string, string | number>} string
 */

/**
 * select type validate
 * @param {string} key
 * @param {string} data
 * @param {Config} config
 * @param {Option} option
 * @returns {Array<null | {type: string, msg: string} | string>}
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
 * @param {string} key
 * @param {number} data
 * @param {Config} config
 * @returns {Array<null | {type: string, msg: string} | number>}
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
 * @param {string} key
 * @param {string} data
 * @param {Config} config
 * @returns {Promise<Array<null | {type: string, msg: string} | number>> | Array<null | {type: string, msg: string} | number>}
 */
async function db(key, data, config) {
  const { dbType, collection, findKey } = config.checkObj;

  if (!!data.toString().trim() && dbType === "mongo") {
    const result = await database
      .collection(collection)
      .findOne({ [findKey]: data });

    if (!result) {
      return [err(key, data, "invalid"), data];
    }
  }

  return [null, data];
}

/**
 * regex type validate
 * @param {string} key
 * @param {string} data
 * @param {Config} config
 * @returns {Array<null | {type: string, msg: string} | string>}
 */
function regex(key, data, config) {
  if (!!data.toString().trim() && !config.regex.test(data)) {
    return [err(key, data, "invalid"), data];
  }

  return [null, data];
}

module.exports = { validateHandler, fieldConvertor, requireValidate };
