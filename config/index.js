class Config {
  constructor(config) {
    this.config = config;
  }

  err_cnt = 0;
  empty_cnt = 0;

  validate = (sheet) => {
    // sheet (Array)
    // 각 데이터를 순회하며 데이터 검증
    const result = [];

    const errorHandler = {
      invalid: () => this.err_cnt++,
      empty: () => this.empty_cnt++,
    };

    for (const row of sheet) {
      const temp = [[]];

      for (const key in this.config) {
        const [msg] = temp;
        const [err, resultData] = this.config[key].fn(
          key.replace(/\s/g, "").replace(/\([^)]*\)/g, ""),
          row[key],
        );
        temp.push(resultData);

        if (!!err) {
          msg.push(err.msg);
          errorHandler[err.type]();
        }
      }

      result.push(temp);
    }

    return { result, err_cnt: this.err_cnt, empty_cnt: this.empty_cnt };
  };
}

module.exports = {
  Config,
  reportConfig: require("./report.js"),
};
