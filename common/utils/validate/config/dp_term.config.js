// column의 _id는 dp_term_history collection의 _id
module.exports.dpTermConfig = {
  // 없으면 추가, 수정시 용어의 ID값
  ID: {
    required: false,
    type: "id",
    column: "_id",
    dataType: "string",
    refer: null,
  },
  비즈용어명: {
    type: "none",
    required: true,
    column: "name",
    dataType: "string",
  },
  비즈용어분류1: {
    required: true,
    type: "select",
    checkObj: "term",
    column: "term_category",
    dataType: "string",
  },
  비즈용어분류2: {
    required: false,
    type: "select",
    checkObj: "term",
    column: "term_category_2",
    dataType: "string",
  },
  비즈용어분류3: {
    required: false,
    type: "select",
    checkObj: "term",
    column: "term_category_3",
    dataType: "string",
  },
  비즈용어출처: {
    required: true,
    type: "select",
    checkObj: { 업무용어: 1, 보고서용어: 1, 비즈용어: 1 },
    column: "term_source",
    dataType: "string",
  },
  비즈용어유형: {
    required: true,
    type: "select",
    checkObj: { 일반: 1, 계수: 1, 보고서용어: 1 },
    column: "term_type",
    dataType: "string",
  },
  사용대상구분: {
    required: true,
    type: "select",
    checkObj: { 내부: 1, 외부: 1 },
    column: "in_out",
    dataType: "string",
  },
  비즈용어설명: {
    required: true,
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
    // type: "db",
    // checkObj: {
    //   dbType: "mongo",
    //   collection: "user",
    //   findKey: "userId",
    // },
  },
  // ','로 구분
  키워드: {
    required: true,
    type: "none",
    column: "tags",
    dataType: "string",
  },
  // ','로 구분
  연관어: {
    required: false,
    type: "none",
    column: "reference_names",
    dataType: "string",
  },
  // 테이블정보(인스턴스명.스키마명.테이블명.컬럼명) (콤마구분)
  // 1. ','를 기준으로 split하여 영숫자,한글,_,-이외에 문자 포함됬는지 확인
  // 2. 1의 split된 문자열에 '.'개수가 3개 이하인지 확인
  테이블정보: {
    required: false,
    type: "none",
    // type: "regex",
    // regex: /^(?:[\uAC00-\uD7A3a-zA-Z0-9_-]+(?:\.(?=[\uAC00-\uD7A3a-zA-Z0-9_-]+)(?!\.)){0,3},?)+$/,
    column: "tb_dataset_ids,col_dataset_ids",
    dataType: "array",
  },
  IT용어: {
    required: false,
    type: "none",
    column: "it_terms",
    dataType: "string",
  },
  산출주기: {
    required: false,
    type: "none",
    column: "calc_period",
    dataType: "string",
  },
  분석관점산출주기: {
    required: false,
    type: "none",
    column: "anal_calc_period",
    dataType: "string",
  },
  산출범위: {
    required: true,
    type: "none",
    column: "calc_range",
    dataType: "string",
  },
  산출기준: {
    required: false,
    type: "none",
    column: "calc_std",
    dataType: "string",
  },
  원천SQL: {
    required: false,
    type: "none",
    column: "source_sql",
    dataType: "string",
  },
  정보계SQL: {
    required: false,
    type: "none",
    column: "info_sql",
    dataType: "string",
  },
  빅데이터SQL: {
    required: false,
    type: "none",
    column: "big_sql",
    dataType: "string",
  },
  // 보고서명(보고서번호.항목명)
  // '.'로 보고서 번호, 항목명 구분
  // const [ reportNumber, itemName ] = data.split('.')
  // 정규식 테스트
  보고서명: {
    required: false,
    type: "regex",
    regex: /^[a-zA-Z0-9\u3131-\uD79D]+$/,
    column: "report_dataset_id",
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
  비고: {
    required: false,
    type: "none",
    column: "etc",
    dataType: "string",
  },
  // 테스트: {
  //     required: false,
  //     type: "range",
  //     unique: true,
  //     checkObj: { start: 1, end: 100 },
  //     column: '',
  //     dataType:'',
  // },
};
