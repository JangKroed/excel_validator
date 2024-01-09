// column의 _id는 dp_term_history collection의 _id
module.exports.dpTermConfig = {
  // 없으면 추가, 수정시 용어의 ID값
  ID: {
    required: false,
    type: "none",
    column: "_id",
    refer: null,
    dataType: "string",
  },
  비즈용어명: {
    required: true,
    type: "none",
    column: "name",
    dataType: "string",
  },
  정의: {
    required: true,
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
    column: "owner_dept_id,owner_dept_name,owner_user_id,owner_name",
    dataType: "array",
  },
  키워드: {
    required: false,
    type: "none",
    column: "tags",
    dataType: "string",
  },
  // ex) PGSDW.LGMJVDP.TB_TRUST_FT
  // col_dataset_ids[i].dataset_id: PGSDW.LGMJVDP
  // col_dataset_ids[i].name: TB_TRUST_FT
  테이블정보: {
    required: false,
    type: "table",
    column: "col_dataset_ids",
    dataType: "array",
  },
  IT용어: {
    required: false,
    type: "none",
    column: "it_term",
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
  산출식: {
    required: false,
    type: "none",
    column: "calc_formula",
    dataType: "string",
  },
  산출기준: {
    required: false,
    type: "none",
    column: "calc_std",
    dataType: "string",
  },
  기간계SQL: {
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
  데이터레이크SQL: {
    required: false,
    type: "none",
    column: "big_sql",
    dataType: "string",
  },
  보고서정보: {
    required: false,
    type: "none",
    column: "report_dataset",
    dataType: "array",
  },
  비고: {
    required: false,
    type: "",
    checkObj: "",
    column: "etc",
    dataType: "string",
  },
};
