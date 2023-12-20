const tempIdList = {
  AP020498: {
    name: "조명진",
    team: "기타 협력업체",
  },
  FP017190: {
    name: "김정욱",
    team: "거버넌스팀",
  },
  MP02136: {
    name: "홍희도",
    team: "기타 협력업체",
  },
  CP017849: {
    name: "오윤기",
    team: "기타 협력업체",
  },
  AP018013: {
    name: "이도연",
    team: "거버넌스팀",
  },
};

function isNotValidation(_, data) {
  return [null, data];
}

const IS_NOT_NULL_MESSAGE = (field) => `[${field}] 필수 입력값입니다.`;
const INVALID_VALUE = (field, value) =>
  `${field}[${value}] 잘못된 입력값입니다.`;

function idValidation(_, data) {
  if (!data) {
    return [null, "ID값이 null일 경우 할당되어야 합니다."];
  }

  return [null, data];
}

function requiredValidation(key, data) {
  if (!data.trim()) {
    const err = {
      type: "empty",
      msg: IS_NOT_NULL_MESSAGE(key),
    };

    return [err, data];
  }

  return [null, data];
}

function selectValidation(key, data) {
  if (this.required) {
    return requiredValidation(key, data);
  }

  if (!this.values.includes(data)) {
    const err = {
      type: "invalid",
      msg: INVALID_VALUE(key, data),
    };

    return [err, data];
  }

  return [null, data];
}

function findUser(key, data) {
  const user = tempIdList[data];
  if (!user) {
    const err = {
      type: "invalid",
      msg: `${key}[${data}] 사번이 존재하지 않습니다.`,
    };

    return [err, data];
  }

  return [null, data];
}

function userValidation(key, data) {
  if (this.required) {
    const result = requiredValidation(key, data);
    if (result[0]) {
      return result;
    } else {
      return findUser(key, data);
    }
  }

  const result = findUser(key, data);
  if (!!data && result[0]) {
    return result;
  }

  return [null, data];
}

function reportTitleValidation(key, data) {
  const regex = /^[a-zA-Z0-9\u3131-\uD79D]+$/;

  if (!!data && !regex.test(data)) {
    const err = {
      type: "invalid",
      msg: INVALID_VALUE(key, data),
    };
    return [err, data];
  }

  return [null, data];
}

module.exports = {
  ID: {
    fn: idValidation,
  },
  비즈용어명: {
    fn: requiredValidation,
  },
  "비즈용어\r\n분류1": {
    fn: requiredValidation,
  },
  "비즈용어\r\n분류2": {
    fn: isNotValidation,
  },
  "비즈용어\r\n분류3": {
    fn: isNotValidation,
  },
  "비즈용어\r\n출처": {
    values: ["업무용어", "보고서용어"],
    required: true,
    fn: selectValidation,
  },
  "비즈용어\r\n유형": {
    values: ["일반", "계수"],
    required: true,
    fn: selectValidation,
  },
  "사용대상\r\n구분": {
    values: ["내부", "외부"],
    required: true,
    fn: selectValidation,
  },
  "비즈용어 설명": {
    fn: isNotValidation,
  },
  현업담당자1: {
    required: true,
    fn: userValidation,
  },
  현업담당자2: {
    fn: userValidation,
  },
  업무담당자1: {
    fn: userValidation,
  },
  업무담당자2: {
    fn: userValidation,
  },
  키워드: {
    fn: requiredValidation,
  },
  연관어: {
    fn: isNotValidation,
  },
  "테이블정보\r\n(인스턴스명.스키마명.테이블명.컬럼명) (콤마구분)": {
    fn: isNotValidation,
  },
  IT용어: {
    fn: isNotValidation,
  },
  산출주기: {
    fn: isNotValidation,
  },
  "분석관점\r\n산출주기": {
    fn: isNotValidation,
  },
  산출범위: {
    fn: isNotValidation,
  },
  산출기준: {
    fn: isNotValidation,
  },
  원천SQL: {
    fn: isNotValidation,
  },
  정보계SQL: {
    fn: isNotValidation,
  },
  빅데이터SQL: {
    fn: isNotValidation,
  },
  "보고서 명\r\n(보고서번호.항목명)": {
    fn: reportTitleValidation,
  },
  "사용자정의항목 입력1": {
    fn: isNotValidation,
  },
  "사용자정의항목 입력2": {
    fn: isNotValidation,
  },
  "사용자정의항목 입력3": {
    fn: isNotValidation,
  },
  "사용자정의항목 입력4": {
    fn: isNotValidation,
  },
  "사용자정의항목 입력5": {
    fn: isNotValidation,
  },
  비고: {
    fn: isNotValidation,
  },
};
