const { UUID } = require("mongodb");

class ValidateHandler {
  constructor() {
    this.validateHandler = {
      id: this._id,
      none: this._none,
      select: this._select,
      // range: this._range,
      // regex: this._regex,
      user: this._user,
      table: this._table,
    };
  }

  _user = (key, data, _, option) => {
    option.test.owner = [];
    let isInvalid = false;

    const items = data
      .replace(" ", "")
      .split(",")
      .map((str) => str.replace(/[\r\n]/g, ""));

    const form = {
      owner_dept_id: "N/A",
      owner_user_id: "N/A",
      it_owner_dept_id: "N/A",
      it_owner_user_id: "N/A",
    };

    for (const item of items) {
      if (isInvalid) {
        break;
      }

      const owners = item.replace("(", ",").replace(")", "").split(",");

      const { user: users } = option;

      let copyForm = Object.assign({}, form);

      for (let i = 0; i < owners.length; i++) {
        const owner = owners[i].trim();

        const ownerSplit = owner.split(">").map((str) => str.trim());

        const re = /^[^@]+@[^@]+\.[^@]+$/;

        if (owner === "N/A" || owner === "") {
          continue;
        } else if (re.test(owner)) {
          let invalid_user = true;

          for (const user of users) {
            const { DEPT_ID, EMAIL, USER_ID } = user;

            if (EMAIL === owner) {
              switch (i) {
                case 0:
                  copyForm.owner_dept_id = DEPT_ID;
                  copyForm.owner_user_id = USER_ID;
                  break;
                case 1:
                  copyForm.it_owner_dept_id = DEPT_ID;
                  copyForm.it_owner_user_id = USER_ID;
                  break;
                default:
                  break;
              }

              invalid_user = false;
              break;
            }
          }

          if (invalid_user) {
            isInvalid = true;
            break;
          }
        } else if (ownerSplit.length > 1) {
          let invalid_user = true;
          for (const user of users) {
            const { DEPT_ID, DEPT_FULL_NMS } = user;

            if (this._isNamesEqule(ownerSplit, DEPT_FULL_NMS)) {
              switch (i) {
                case 0:
                  copyForm.owner_dept_id = DEPT_ID;
                  break;
                case 1:
                  copyForm.it_owner_dept_id = DEPT_ID;
                  break;
                default:
                  break;
              }

              invalid_user = false;
              break;
            }
          }

          if (invalid_user) {
            isInvalid = true;
            break;
          }
        } else {
          isInvalid = true;
          break;
        }
      }

      if (!isInvalid) {
        option.test.owner.push(copyForm);
      }
    }

    return isInvalid ? [this._err(key, data, "invalid"), data] : [null, data];
  };

  _isNamesEqule = (a, b) => {
    b = b.map((str) => str.replace(" ", ""));
    return a[0] === b[0] && a.at(-1) === b.at(-1);
  };

  _table = (key, data, _, option) => {
    // return [this._err(key, data, "invalid"), data];
    const tables = option.table;

    const dataset_ids = data.split(",").map((str) => String(str).trim());

    // item(dataset_id)에 column_name이 포함되어 있는지 확인
    for (const item of dataset_ids) {
      let isInvalid = true;

      for (const { dataset_id } of tables) {
        if (item === dataset_id) {
          isInvalid = false;
          break;
        }
      }

      if (isInvalid) {
        return [this._err(key, data, "invalid"), data];
      }
    }

    return [null, data];
  };

  /**
   * 필드 공백 및 괄호문자열 제거
   * @param {string} str
   * @returns {string}
   */
  fieldConvertor = (str) =>
    str
      .replace(/\s/g, "")
      .replace(/\([^)]*\)/g, "")
      .replace("*", "");

  /**
   * null error message
   * @param {string} field
   * @returns {string}
   * @description 리턴 값 형식 - `[E][${field}] 필수 입력값입니다.`
   * @private
   */
  _IS_NOT_NULL_MESSAGE = (field) =>
    `[E][${this.fieldConvertor(field)}] 필수 입력값입니다.`;

  /**
   * invalid error message
   * @param {string} field
   * @param {string | number} value
   * @returns {string}
   * @description 리턴 값 형식 - `[E]${string}[${string}] 잘못된 입력값입니다.`
   * @private
   */
  _INVALID_VALUE = (field, value) =>
    `[E]${this.fieldConvertor(field)}[${value}] 잘못된 입력값입니다.`;

  /**
   * warm invalid error message
   * @param {string} field
   * @param {string | number} value
   * @returns {string}
   * @description 리턴 값 형식 - `[W]${string}[${string}] 잘못된 입력값입니다.`
   * @private
   */
  _WARM_INVALID_VALUE = (field, value) =>
    `[W]${this.fieldConvertor(field)}[${value}] 잘못된 입력값입니다.`;

  /**
   * 유효성 검사 실패 메세지 핸들러
   * @type {{warm: Function, invalid: Function, empty: Function}}
   * @private
   */
  _messageHandler = {
    invalid: this._INVALID_VALUE,
    empty: this._IS_NOT_NULL_MESSAGE,
    warm: this._WARM_INVALID_VALUE,
  };

  /**
   * create error object
   * @param {string} key
   * @param {string | number} data
   * @param {string} type
   * @returns {{msg: string, type: string}}
   * @private
   */
  _err = (key, data, type) => {
    return {
      type,
      msg: this._messageHandler[type](this.fieldConvertor(key), data),
    };
  };

  /**
   * _id type validate
   * @param {string} key
   * @param {string | number} data
   * @param {{[key: string]: string | array | object}} config
   * @param {{[key: string]: string | array | object}} option
   * @returns {[null, string]}
   * @private
   */
  _id = (key, data, config, option) => {
    option.test._id = !!data.toString().trim().length
      ? data
      : new UUID().toString();

    return [null, data];
  };

  /**
   * none type validate
   * @param {string} key
   * @param {string | number} data
   * @param {{[key: string]: string | array | object}} config
   * @param {{[key: string]: string | array | object}} option
   * @returns {[null, string]}
   * @private
   */
  _none = (key, data, config, option) => {
    option.test[config.column] = key.includes("SQL")
      ? data
      : data.replace(/[\r\n]/g, "");

    return [null, data];
  };

  /**
   * required validate
   * @param {string} key
   * @param {string | number} data
   * @param {boolean | undefined} required
   * @returns {[{msg: string, type: string}, string | number] | null}
   */
  requireValidate = (key, data, required) => {
    if (required && !data.toString().trim()) {
      return [this._err(key, data, "empty"), data];
    }

    return null;
  };

  /**
   * select type validate
   * @param {string} key
   * @param {string | number} data
   * @param {{[key: string]: string | array | object}} config
   * @param {{[key: string]: string | array | object}} option
   * @returns {[null, string | number] | [{msg: string, type},undefined]}
   * @private
   */
  _select = (key, data, config, option) => {
    // db insert data cashing
    if (!data) {
      option.test[config.column] = config.column === "array" ? [] : "";
      return [null, data];
    }

    option.test[config.column] =
      config.column === "array" ? data.split(",") : data;

    // validation start
    let { checkObj } = config;

    // checkObj가 string일 경우 option 에서 참조하므로 checkObj에 재할당
    if (typeof checkObj === "string") {
      if (!option[checkObj]) {
        throw new Error(`${key}: ${data} - ${checkObj} is option invalid!})`);
      }

      // option[checkObj]의 "123,456,789" 형식일때
      checkObj = this._isSplit(option[checkObj])
        ? option[checkObj].split(",")
        : option[checkObj];
    }

    let isInvalid = false;

    for (const item of data.split(",")) {
      // checkObj가 Array타입일때
      if (this._isArray(checkObj) && !checkObj.includes(item)) {
        isInvalid = true;
        break;
      }

      // checkObj가 Object타입일때
      if (this._isObject(checkObj) && !checkObj[item]) {
        isInvalid = true;
        break;
      }
    }

    if (isInvalid) {
      return [this._err(key, data, "invalid"), data];
    }

    return [null, data];
  };

  /**
   * split length가 1 이상인지 ?
   * @param target
   * @returns {boolean}
   * @private
   */
  _isSplit(target) {
    return typeof target === "string" && target.split(",").length > 1;
  }

  _isArray(target) {
    return Array.isArray(target);
  }

  _isObject(target) {
    return !Array.isArray(target) && typeof target === "object";
  }

  /**
   * range type validate
   * @param key
   * @param data
   * @param config
   * @returns {[{msg: *, type},number]|[null,number]}
   * @private
   */
  _range = (key, data = 0, config) => {
    const { start, end } = config.checkObj;

    const target = Number(data);

    if (!!data && (isNaN(target) || !(start <= target && target <= end))) {
      return [this._err(key, data, "invalid"), data];
    }

    return [null, data];
  };

  /**
   * regex type validate
   * @param key
   * @param data
   * @param config
   * @returns {[null,undefined]|[{msg: *, type},undefined]}
   * @private
   */
  _regex = (key, data, config) => {
    data = data.replace(/\r|\n| /g, "");
    if (!!data.toString().trim() && !config.regex.test(data)) {
      return [this._err(key, data, "invalid"), data];
    }

    return [null, data];
  };
}

module.exports = { ValidateHandler };
