module.exports.reportColumnConfig = {
  보고서번호: {
    required: false,
    type: "none",
    column: "dataset_id",
    dataType: "string",
  },
  번호: {
    required: false,
    type: "none",
    // unique: true,
    column: "position",
    dataType: "string", // ?
  },
  항목명: {
    required: false,
    type: "none",
    column: "name",
    dataType: "string",
  },
  설명: {
    required: false,
    type: "none",
    column: "desc",
    dataType: "string",
  },
  키워드: {
    required: false,
    type: "none",
    column: "tags",
    dataType: "string",
  },
  테이블정보: {
    required: false,
    type: "none",
    // type: "regex",
    // regex: /^(?:[\uAC00-\uD7A3a-zA-Z0-9_-]+(?:\.(?=[\uAC00-\uD7A3a-zA-Z0-9_-]+)(?!\.)){0,3},?)+$/,
    column: "tb_dataset_ids",
    dataType: "array",
  },
  산출식: {
    required: false,
    type: "none",
    column: "calc",
    dataType: "string",
  },
  사용자정의항목구분: {
    required: false,
    type: "none",
    column: "att1",
    dataType: "string",
  },
  사용자정의항목입력2: {
    required: false,
    type: "none",
    column: "att2",
    dataType: "string",
  },
  사용자정의항목입력3: {
    required: false,
    type: "none",
    column: "att3",
    dataType: "string",
  },
  사용자정의항목입력4: {
    required: false,
    type: "none",
    column: "att4",
    dataType: "string",
  },
  사용자정의항목입력5: {
    required: false,
    type: "none",
    column: "att5",
    dataType: "string",
  },
};