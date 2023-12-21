const {
  validateHandler,
  fieldConvertor,
  requireValidate,
} = require("./functions");

function fieldValidation(config, sheet) {
  const sheetFields = Object.keys(sheet[0]);
  for (const field of sheetFields) {
    if (!config[fieldConvertor(field)]) {
      return false;
    }
  }

  return true;
}

function validate(config, sheet) {
  // TODO - 데이터를 입력받으면 일단 config field와 sheet field가 일치하는지 확인필요
  const hasFields = fieldValidation(config, sheet);
  if (!hasFields) {
    throw new Error("업로드 양식이 아닙니다. 컬럼정보를 확인해주세요.");
  }

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
