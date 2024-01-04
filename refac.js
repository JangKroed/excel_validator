console.log("asdfasdf");
const mongodb = require("mongodb");
const _ = require("lodash");
require("dotenv").config();

const { MONGO_URL } = process.env;

let mongo_code_update = async () => {
  // let mongoClient = await mongodb.MongoClient.connect("mongodb://dpuser:dpuser@s-mongodb:27017?authSource=dp");
  let mongoClient = await mongodb.MongoClient.connect(MONGO_URL);
  const db = mongoClient.db("dp");
  let collection = db.collection("standard");
  let data = await collection
    .find({ _id: { $ne: "source_system" } })
    .sort()
    .toArray();

  let obj = {};

  for (const item of data) {
    const id = item._id;

    if (!obj[id]) {
      obj[id] = {};
    }

    for (const children of item.children) {
      const childVal = children.value;
      const childName = children.name;

      if (!childVal) {
        continue;
      }

      if (!obj[id][childVal]) {
        obj[id][childName] = childVal;
        obj[id][`LV1_${childName}`] = childVal;
      }

      for (const children2 of children.children) {
        const child2Val = children2.value;
        const child2Name = children2.name;

        if (obj[id][`${childName}_${child2Name}`]) {
          continue;
        }

        obj[id][`${childName}_${child2Name}`] = child2Val;
        obj[id][`LV2_${child2Name}`] = child2Val;
      }
    }
  }

  let sysobj = {};
  collection = db.collection("systemStandard");
  data = await collection
    .find()
    .sort({ SYS_NM: 1, APPLICATION_NM_KOR: 1 })
    .toArray();

  let system_keys = [];
  data.forEach((item) => {
    item.SYS_NM = item.SYS_NM.trim();

    const {
      FINAL_USE_YN_NM,
      SYS_NM,
      _id: id,
      APPLICATION_NM_KOR,
      BIZ_DOMAIN_CD,
      BIZ_DOMAIN_NM,
      PI_AGENT_TEAM_NM,
    } = item;

    if (!sysobj[APPLICATION_NM_KOR]) {
      sysobj[APPLICATION_NM_KOR] = [];
      system_keys.push(APPLICATION_NM_KOR);
    }

    const tempObj = {
      FINAL_USE_YN_NM: FINAL_USE_YN_NM,
      LV1_NM: SYS_NM,
      LV1_CD: SYS_NM,
      LV2_CD: id,
      LV2_NM: APPLICATION_NM_KOR,
      BIZ_DOMAIN_CD,
      BIZ_DOMAIN_NM,
      PI_AGENT_TEAM_NM: PI_AGENT_TEAM_NM,
    };

    sysobj[APPLICATION_NM_KOR].push(tempObj);
  });

  for (const key of system_keys) {
    if (sysobj[key].length <= 1) {
      continue;
    }

    const useFinal = _.filter(sysobj[key], { FINAL_USE_YN_NM: "사용중" });
    const notUseFinal = _.filter(sysobj[key], { FINAL_USE_YN_NM: "미사용" });

    if (useFinal.length > 0) {
      sysobj[key] = useFinal;
    } else if (notUseFinal.length > 0) {
      sysobj[key] = notUseFinal;
    } else {
      console.log(sysobj[key]);
    }
  }

  // console.log(obj);
  console.log(system_keys.at(-1), sysobj[system_keys.at(-1)]);

  collection = db.collection("dpasset");
  const cursor = await collection.find({
    asset_type: "table",
    status: { $nin: ["미분류"] },
  });

  let ch1List = [
    "value_chain",
    "source_system",
    "usage_purpose",
    "product_category",
    "data_type",
    "table_data_type",
  ];

  let err_dpasset = db.collection("err_dpasset");
  await err_dpasset.deleteMany({});

  const useFieldList = [
    "data_type_lv1",
    "product_category_lv1",
    "product_category_lv2",
    "source_system_lv1",
    "source_system_lv2",
    "table_data_type_lv1",
    "usage_purpose_lv1",
    "usage_purpose_lv2",
    "value_chain_lv1",
    "value_chain_lv2",
  ];

  let cnt = 0;
  while (await cursor.hasNext()) {
    // Iterate entire data
    let item = await cursor.next();
    let errList = [];
    cnt++;

    if (item.status === "비대상") {
      // 특정 필드 null 초기화
      for (const field of useFieldList) {
        item[field] = null;
      }

      for (let i = 2; i < 11; i++) {
        //2~10
        // product_category source_system
        // console.log('product_category'+i+'_lv1', 'product_category'+i+'_lv2', 'source_system'+i+'_lv1', 'source_system'+i+'_lv2');
        if (item[`product_category${i}_lv1`]) {
          item[`product_category${i}_lv1`] = null;
        }
        if (item[`product_category${i}_lv2`]) {
          item[`product_category${i}_lv2`] = null;
        }
        if (item[`source_system${i}_lv1`]) {
          item[`source_system${i}_lv1`] = null;
        }
        if (item[`source_system${i}_lv2`]) {
          item[`source_system${i}_lv2`] = null;
        }
      }

      await collection.updateOne({ _id: item._id }, { $set: item });
    } else {
      for (const ck of ch1List) {
        if (ck === "source_system") {
          if (sysobj[item[`${ck}_lv2`]]) {
            let snm = item[`${ck}_lv2`];

            const { LV1_CD, LV2_CD } = sysobj[snm][0];

            item[`${ck}_lv1`] = LV1_CD;
            item[`${ck}_lv2`] = LV2_CD;
          } else {
            const lv2 = item[`${ck}_lv2`];
            errList.push({ field: ck, lv2 });
          }
        } else {
          if (!item[`${ck}_lv1`]) {
            continue;
          }

          if (!obj[ck][item[`${ck}_lv1`]]) {
            if (!item[`${ck}_lv2`]) {
              continue;
            }

            const itemKey = `${item[`${ck}_lv1`]}_${item[`${ck}_lv2`]}`;

            if (obj[ck][itemKey]) {
              item[`${ck}_lv2`] = obj[ck][itemKey];
            } else {
              errList.push({
                field: ck,
                lv1: item[`${ck}_lv1`],
                lv2: item[`${ck}_lv2`],
              });
            }

            item[`${ck}_lv1`] = obj[ck][item[`${ck}_lv1`]];
          } else {
            errList.push({
              field: ck,
              lv1: item[`${ck}_lv1`],
              lv2: item[`${ck}_lv2`],
            });
          }
        }
      }

      ///////////////////////////////////////////////////////////////////////

      ch1List.forEach(function (ck) {
        //['value_chain', 'source_system','usage_purpose','product_category','data_type','table_data_type'];
        if (ck !== "source_system") {
          if (item[ck + "_lv1"]) {
            if (obj[ck][item[ck + "_lv1"]]) {
              if (item[ck + "_lv2"]) {
                if (obj[ck][item[ck + "_lv1"] + "_" + item[ck + "_lv2"]]) {
                  item[ck + "_lv2"] =
                    obj[ck][item[ck + "_lv1"] + "_" + item[ck + "_lv2"]];
                } else {
                  errList.push({
                    field: ck,
                    lv1: item[ck + "_lv1"],
                    lv2: item[ck + "_lv2"],
                  });
                }
              }
              item[ck + "_lv1"] = obj[ck][item[ck + "_lv1"]];
            } else {
              errList.push({
                field: ck,
                lv1: item[ck + "_lv1"],
                lv2: item[ck + "_lv2"],
              });
            }
          }
        } else {
          if (sysobj[item[`${ck}_lv2`]]) {
            let snm = item[`${ck}_lv2`];

            const { LV1_CD, LV2_CD } = sysobj[snm][0];

            item[`${ck}_lv1`] = LV1_CD;
            item[`${ck}_lv2`] = LV2_CD;
          } else {
            const lv2 = item[`${ck}_lv2`];
            errList.push({ field: ck, lv2 });
          }
        }
        //ck :  source_system
        if (ck == "product_category" || ck == "source_system") {
          for (let i = 2; i < 11; i++) {
            //2~10
            let nm = ck + i; //product_category2
            if (item[nm + "_lv1"]) {
              if (ck == "product_category") {
                if (item[nm + "_lv1"]) {
                  if (obj[ck][item[nm + "_lv1"]]) {
                    if (item[nm + "_lv2"]) {
                      if (
                        obj[ck][item[nm + "_lv1"] + "_" + item[nm + "_lv2"]]
                      ) {
                        item[nm + "_lv2"] =
                          obj[ck][item[nm + "_lv1"] + "_" + item[nm + "_lv2"]];
                      } else {
                        errList.push({
                          field: nm,
                          lv1: item[nm + "_lv1"],
                          lv2: item[nm + "_lv2"],
                        });
                      }
                    }
                    item[nm + "_lv1"] = obj[ck][item[nm + "_lv1"]];
                  } else {
                    errList.push({
                      field: nm,
                      lv1: item[nm + "_lv1"],
                      lv2: item[nm + "_lv2"],
                    });
                  }
                }
              } else {
                if (sysobj[item[nm + "_lv2"]]) {
                  let snm = item[nm + "_lv2"];
                  item[nm + "_lv2"] = sysobj[snm][0].LV2_CD;
                  item[nm + "_lv1"] = sysobj[snm][0].LV1_CD;
                } else {
                  errList.push({ field: nm, lv2: item[nm + "_lv2"] });
                }
              }
            }
          }
        }
      });
    }
    if (errList.length > 0) {
      console.log(item, errList);
    } else {
      // await collection.updateOne({_id:item._id}, {$set: item} );
    }
  }
  console.log("END");
  return obj;
};

// {arg: 'enable_data_reset', type: 'boolean'},비대상 리셋
// {arg: 'updateYn', type: 'boolean'}//dpasset real update
mongo_code_update();
