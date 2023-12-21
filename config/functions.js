const validateHandler = {
  none,
  id,
  select,
  range,
  user,
};

const fieldConvertor = (str) =>
  str.replace(/\s/g, "").replace(/\([^)]*\)/g, "");

const IS_NOT_NULL_MESSAGE = (field) =>
  `[${fieldConvertor(field)}] 필수 입력값입니다.`;

const INVALID_VALUE = (field, value) =>
  `${fieldConvertor(field)}[${value}] 잘못된 입력값입니다.`;

const messageHandler = {
  invalid: INVALID_VALUE,
  empty: IS_NOT_NULL_MESSAGE,
};

const err = (key, data, type) => {
  return {
    type,
    msg: messageHandler[type](fieldConvertor(key), data),
  };
};

function none(_, data) {
  return [null, data];
}

function id(_, data) {
  if (!data) {
    data = "ID값이 null일 경우 할당되어야 합니다.";
  }

  return [null, data];
}

function requireValidate(key, data, required) {
  if (required && !!data && !data.toString().trim()) {
    return [err(key, data, "empty"), data];
  }

  return null;
}

function select(key, data, config) {
  const { checkObj } = config;

  if (!!data && !checkObj[data.trim()]) {
    return [err(key, data, "invalid"), data];
  }

  return [null, data];
}

function range(key, data = 0, config) {
  const { start, end } = config.checkObj;

  const target = Number(data);

  if (isNaN(target) || !(start <= target && target <= end)) {
    return [err(key, data, "invalid"), data];
  }

  return [null, data];
}

// TODO 1 - DB에서 유저 조회 필요할경우 해당로직으로 수정
// TODO 2 - DB조회 로직이 아닐경우 user 타입을 select로 변경
function user(key, data, config) {
  const { checkObj } = config;

  if (!!data && !checkObj[data.trim()]) {
    return [err(key, data, "invalid"), data];
  }

  return [null, data];
}

module.exports = { validateHandler, fieldConvertor, requireValidate };
