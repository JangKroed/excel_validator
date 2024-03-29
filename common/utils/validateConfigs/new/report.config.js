module.exports.reportConfig = {
  ID: {
    required: false,
    type: "id",
    column: "_id",
    dataType: "string",
  },
  "수기/정형구분": {
    required: true,
    type: "select",
    checkObj: ["수기", "정형"],
    column: "report_type",
    dataType: "string",
  },
  시스템명: {
    required: true,
    type: "none",
    column: "system_nm",
    dataType: "string",
  },
  보고서파일명: {
    required: true,
    type: "none",
    column: "file_name",
    dataType: "string",
  },
  보고서경로: {
    required: true,
    type: "none",
    column: "path",
    dataType: "string",
  },
  보고서명: {
    required: true,
    type: "none",
    column: "name",
    dataType: "string",
  },
  페이지번호: {
    required: false,
    type: "none",
    column: "page",
    dataType: "string",
  },
  정의: {
    required: false,
    type: "none",
    column: "desc",
    dataType: "string",
  },
  // data.split(',')으로 구분
  // 입력 형식은 현업담당자(업무담당자) 형식
  // 팀단위 입력시 본부 > 팀
  // 개인 입력시 이메일 주소
  // ex)
  // 팀 - 홈쇼핑BU>우리동네GS팀(N/A)
  // 개인 - example@gmail.com(N/A)
  현업담당자: {
    required: true,
    type: "user",
    column: "owner",
    dataType: "array",
  },
  키워드: {
    required: false,
    type: "none",
    column: "tags",
    dataType: "string",
  },
  테이블정보: {
    required: false,
    type: "table",
    checkObj: "tables",
    column: "dataset_ids",
    dataType: "array",
  },
  보고서SQL: {
    required: false,
    type: "none",
    column: "report_sql",
    dataType: "string",
  },
  비고: {
    required: false,
    type: "none",
    column: "etc",
    dataType: "string",
  },
  항목: {
    required: false,
    type: "select",
    checkObj: "childs",
    column: "childs",
    dataType: "array",
  },
};
