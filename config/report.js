/**
 * config fields - type, required, regex?, checkObj?
 *
 * types - none, select, range, id, user, tableInfo?(테이블정보)
 */
module.exports = {
  // 없으면 추가, 수정시 용어의 ID값
  ID: {
    required: false,
    type: "id",
  },
  비즈용어명: {
    required: true,
  },
  비즈용어분류1: {
    required: true,
    type: "select",
    checkObj: {
      LPOINT: 1,
      LPAY: 1,
      PG: 1,
      채널: 1,
      보안: 1,
      업무: 1,
      통합회원: 1,
      구매상품: 1,
      포인트관리: 1,
      제휴관리: 1,
      수수료정산: 1,
      기타: 1,
    },
  },
  비즈용어분류2: {
    required: false,
    type: "none",
  },
  비즈용어분류3: {
    required: false,
    type: "none",
  },
  비즈용어출처: {
    required: true,
    type: "select",
    checkObj: { 업무용어: 1, 보고서용어: 1 },
  },
  비즈용어유형: {
    required: true,
    type: "select",
    checkObj: { 일반: 1, 계수: 1 },
  },
  사용대상구분: {
    required: true,
    type: "select",
    checkObj: { 내부: 1, 외부: 1 },
  },
  비즈용어설명: {
    required: true,
    type: "none",
  },
  현업담당자1: {
    required: true,
    type: "user",
    checkObj: {
      AP020498: 1,
      FP017190: 1,
      MP02136: 1,
      CP017849: 1,
      AP018013: 1,
    },
  },
  현업담당자2: {
    required: false,
    type: "user",
    checkObj: {
      AP020498: 1,
      FP017190: 1,
      MP02136: 1,
      CP017849: 1,
      AP018013: 1,
    },
  },
  업무담당자1: {
    required: false,
    type: "user",
    checkObj: {
      AP020498: 1,
      FP017190: 1,
      MP02136: 1,
      CP017849: 1,
      AP018013: 1,
    },
  },
  업무담당자2: {
    required: false,
    type: "user",
    checkObj: {
      AP020498: 1,
      FP017190: 1,
      MP02136: 1,
      CP017849: 1,
      AP018013: 1,
    },
  },
  // ','로 구분
  키워드: {
    required: true,
    type: "none",
  },
  // ','로 구분
  연관어: {
    required: false,
    type: "none",
  },
  // 테이블정보(인스턴스명.스키마명.테이블명.컬럼명) (콤마구분)
  // .split('.') 하여 각 항목 체크 필요 ?
  // const [ instance, schema, table, column ] = data.split('.')
  테이블정보: {
    required: false,
    type: "none",
  },
  IT용어: {
    required: false,
    type: "none",
  },
  산출주기: {
    required: false,
    type: "none",
  },
  분석관점산출주기: {
    required: false,
    type: "none",
  },
  산출범위: {
    required: true,
    type: "none",
  },
  산출기준: {
    required: false,
    type: "none",
  },
  원천SQL: {
    required: false,
    type: "none",
  },
  정보계SQL: {
    required: false,
    type: "none",
  },
  빅데이터SQL: {
    required: false,
    type: "none",
  },
  // 보고서명(보고서번호.항목명)
  // '.'로 보고서 번호, 항목명 구분
  // const [ reportNumber, itemName ] = data.split('.')
  보고서명: {
    required: false,
    type: "none",
  },
  사용자정의항목입력1: {
    required: false,
    type: "none",
  },
  사용자정의항목입력2: {
    required: false,
    type: "none",
  },
  사용자정의항목입력3: {
    required: false,
    type: "none",
  },
  사용자정의항목입력4: {
    required: false,
    type: "none",
  },
  사용자정의항목입력5: {
    required: false,
    type: "none",
  },
  비고: {
    required: false,
    type: "none",
  },
  테스트: {
    required: false,
    type: "range",
    checkObj: { start: 1, end: 100 },
  },
};
