class ValidateHandler {
  /**
   * 필드 공백 및 괄호문자열 제거
   * @param str
   * @returns {*}
   */
  fieldConvertor = (str) => str.replace(/\s/g, "").replace(/\([^)]*\)/g, "");

  /**
   * null error message
   * @param field
   * @returns {`[E][${string}] 필수 입력값입니다.`}
   * @private
   */
  _IS_NOT_NULL_MESSAGE = (field) =>
    `[E][${this.fieldConvertor(field)}] 필수 입력값입니다.`;

  /**
   * invalid error message
   * @param field
   * @param value
   * @returns {`[E]${string}[${string}] 잘못된 입력값입니다.`}
   * @private
   */
  _INVALID_VALUE = (field, value) =>
    `[E]${this.fieldConvertor(field)}[${value}] 잘못된 입력값입니다.`;

  /**
   * warm invalid error message
   * @param field
   * @param value
   * @returns {`[W]${string}[${string}] 잘못된 입력값입니다.`}
   * @private
   */
  _WARM_INVALID_VALUE = (field, value) =>
    `[W]${this.fieldConvertor(field)}[${value}] 잘못된 입력값입니다.`;

  /**
   * 유효성 검사 실패 메세지 핸들러
   * @type {{warm: *, invalid: *, empty: *}}
   * @private
   */
  _messageHandler = {
    invalid: this._INVALID_VALUE,
    empty: this._IS_NOT_NULL_MESSAGE,
    warm: this._WARM_INVALID_VALUE,
  };

  /**
   * create error object
   * @param key
   * @param data
   * @param type
   * @returns {{msg: *, type}}
   * @private
   */
  _err = (key, data, type) => {
    return {
      type,
      msg: this._messageHandler[type](this.fieldConvertor(key), data),
    };
  };

  /**
   * none type validate
   * @param _
   * @param data
   * @returns {[null,undefined]}
   * @private
   */
  _none = (_, data) => {
    return [null, data];
  };

  /**
   * id type validate
   * @param _
   * @param data
   * @returns {[null,undefined]}
   * @private
   */
  _id = (_, data) => {
    return [null, data];
  };

  /**
   * required validate
   * @param key
   * @param data
   * @param required
   * @returns {[{msg: *, type},undefined]|null}
   */
  requireValidate = (key, data, required) => {
    if (required && !data.toString().trim()) {
      return [this._err(key, data, "empty"), data];
    }

    return null;
  };

  /**
   * select type validate
   * @param key
   * @param data
   * @param config
   * @param option
   * @returns {[null,undefined]|[{msg: *, type},undefined]}
   * @private
   */
  _select = (key, data, config, option) => {
    if (!data) {
      return [null, data];
    }

    let { checkObj } = config;

    // checkObj가 string일 경우 option 에서 참조하므로 checkObj에 재할당
    if (typeof checkObj === "string") {
      if (!option[checkObj]) {
        throw new Error(`${key}: ${data} - ${checkObj} is option invalid!})`);
      }

      // option[checkObj]의 "123,456,789" 형식일때
      if (this._isSplit(option[checkObj])) {
        checkObj = option[checkObj].split(",");
      } else {
        checkObj = option[checkObj];
      }
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
