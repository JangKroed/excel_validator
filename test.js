/**
 * @typedef {Object} Config
 * @property {'none' | 'id' | 'select' | 'range' | 'db' | 'regex'} type 타입종류
 * @property {boolean} required 필수여부
 * @property {boolean} [unique] 유일여부
 * @property {regex} [regex] 정규식
 * @property {Object.<string, string | number>} [checkObj] 검사할 데이터
 */

/**
 *
 * @param {Config} obj
 * @returns {*}
 */
function test(obj) {
  return obj;
}

/**
 * 유효성 검사
 * @param {Object} config 설정
 * @param {'none' | 'id' | 'select' | 'range' | 'db' | 'regex'} config.type
 * @param {boolean} config.required
 * @param {boolean?} config.unique
 * @param {regex?} config.regex
 * @param {string | { [key:string]: string | number }?} config.checkObj
 *
 * @param {WorkSheet} sheet 시트데이터
 * @param {{[key:string]: string | number}} option
 * @returns {Promise<{result: *[], empty_cnt: number, err_cnt: number}> | {result: *[], empty_cnt: number, err_cnt: number}}
 */
