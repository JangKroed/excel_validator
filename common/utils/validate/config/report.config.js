module.exports.reportConfig = {
  번호: {
    required: false,
    type: "none",
    unique: true,
    column: "_id", // 'REPORT. + 번호'
    dataType: "string",
  },
  시스템명: {
    required: true,
    type: "select",
    checkObj: "categories",
    column: "report_category",
    dataType: "string",
  },
  보고서번호: {
    required: true,
    type: "none",
    column: "dataset_id",
    dataType: "string",
  },
  // '>'로 구분한 전체 경로를 정규식으로 ?
  보고서경로: {
    required: true,
    type: "none",
    // type: 'regex',
    // regex: /^[/>]/,
    column: "path",
    dataType: "string",
  },
  // ','구분하며 제휴사 코드가 들어감
  제휴사조회권한: {
    required: false,
    type: "select",
    checkObj: "codes",
    column: "roles",
    dataType: "array",
  },
  // 보고서의 명칭을 시스템에서 제공하는 명칭과 동일하게 입력 ?
  보고서명: {
    required: true,
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
  현업담당자1: {
    required: true,
    type: "select",
    checkObj: "user",
    column:
      "first_owner_dept_id,first_owner_dept_name,first_owner_user_id,first_owner_name",
    dataType: "user",
  },
  현업담당자2: {
    required: false,
    type: "select",
    checkObj: "user",
    column:
      "second_owner_dept_id,second_owner_dept_name,second_owner_user_id,second_owner_name",
    dataType: "user",
  },
  업무담당자1: {
    required: false,
    type: "select",
    checkObj: "user",
    column:
      "first_it_owner_dept_id,first_it_owner_dept_name,first_it_owner_user_id,first_it_owner_name",
    dataType: "user",
  },
  업무담당자2: {
    required: false,
    type: "select",
    checkObj: "user",
    column:
      "second_it_owner_dept_id,second_it_owner_dept_name,second_it_owner_user_id,second_it_owner_name",
    dataType: "user",
  },
  키워드: {
    required: false,
    type: "none",
    column: "tags",
    dataType: "string",
  },
  산출기준: {
    required: false,
    type: "none",
    column: "calc_std",
    dataType: "string",
  },
  산출범위: {
    required: false,
    type: "none",
    column: "calc_range",
    dataType: "string,5",
  },
  테이블정보: {
    required: false,
    type: "none",
    // type: "regex",
    // regex: /^(?:[\uAC00-\uD7A3a-zA-Z0-9_-]+(?:\.(?=[\uAC00-\uD7A3a-zA-Z0-9_-]+)(?!\.)){0,3},?)+$/,
    column: "tb_dataset_ids",
    dataType: "array",
  },
  보고서SQL: {
    required: false,
    type: "none",
    column: "report_sql",
    dataType: "string",
  },
  사용자정의항목입력1: {
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