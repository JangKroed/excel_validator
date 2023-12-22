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
  data.forEach(function (item) {
    if (!obj[item._id]) {
      obj[item._id] = {};
    }
    item.children.forEach(function (children) {
      if (children.value) {
        if (!obj[item._id][children.value]) {
          obj[item._id][children.name] = children.value;
          obj[item._id]["LV1_" + children.name] = children.value;
        }
        children.children.forEach(function (children2) {
          if (!obj[item._id][children.name + "_" + children2.name]) {
            obj[item._id][children.name + "_" + children2.name] =
              children2.value;
            obj[item._id]["LV2_" + children2.name] = children2.value;
          }
        });
      }
    });
  });
  let sysobj = {};
  collection = db.collection("systemStandard");
  data = await collection
    .find()
    .sort({ SYS_NM: 1, APPLICATION_NM_KOR: 1 })
    .toArray();
  let system_keys = [];
  data.forEach(function (item) {
    item.SYS_NM = item.SYS_NM.trim();
    if (!sysobj[item.APPLICATION_NM_KOR]) {
      sysobj[item.APPLICATION_NM_KOR] = [];
      system_keys.push(item.APPLICATION_NM_KOR);
    }
    sysobj[item.APPLICATION_NM_KOR].push({
      FINAL_USE_YN_NM: item.FINAL_USE_YN_NM,
      LV1_NM: item.SYS_NM,
      LV1_CD: item.SYS_NM,
      LV2_CD: item._id,
      LV2_NM: item.APPLICATION_NM_KOR,
      BIZ_DOMAIN_CD: item.BIZ_DOMAIN_CD,
      BIZ_DOMAIN_NM: item.BIZ_DOMAIN_NM,
      PI_AGENT_TEAM_NM: item.PI_AGENT_TEAM_NM,
    });
  });
  system_keys.forEach(function (key) {
    if (sysobj[key].length > 1) {
      if (_.filter(sysobj[key], { FINAL_USE_YN_NM: "사용중" }).length == 0) {
        if (_.filter(sysobj[key], { FINAL_USE_YN_NM: "미사용" }).length == 0) {
          console.log(sysobj[key]);
        } else {
          sysobj[key] = _.filter(sysobj[key], { FINAL_USE_YN_NM: "미사용" });
        }
      } else {
        sysobj[key] = _.filter(sysobj[key], { FINAL_USE_YN_NM: "사용중" });
      }
    }
  });
  // console.log(obj);
  console.log(
    system_keys[system_keys.length - 1],
    sysobj[system_keys[system_keys.length - 1]],
  );

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
  let cnt = 0;
  while (await cursor.hasNext()) {
    // Iterate entire data
    cnt++;
    let item = await cursor.next();
    let errList = [];
    if (item.status == "비대상") {
      item.data_type_lv1 = null;
      item.product_category_lv1 = null;
      item.product_category_lv2 = null;
      item.source_system_lv1 = null;
      item.source_system_lv2 = null;
      item.table_data_type_lv1 = null;
      item.usage_purpose_lv1 = null;
      item.usage_purpose_lv2 = null;
      item.value_chain_lv1 = null;
      item.value_chain_lv2 = null;

      for (let i = 2; i < 11; i++) {
        //2~10
        // product_category source_system
        // console.log('product_category'+i+'_lv1', 'product_category'+i+'_lv2', 'source_system'+i+'_lv1', 'source_system'+i+'_lv2');
        if (item["product_category" + i + "_lv1"]) {
          item["product_category" + i + "_lv1"] = null;
        }
        if (item["product_category" + i + "_lv2"]) {
          item["product_category" + i + "_lv2"] = null;
        }
        if (item["source_system" + i + "_lv1"]) {
          item["source_system" + i + "_lv1"] = null;
        }
        if (item["source_system" + i + "_lv2"]) {
          item["source_system" + i + "_lv2"] = null;
        }
      }
      await collection.updateOne({ _id: item._id }, { $set: item });
    } else {
      ch1List.forEach(function (ck) {
        //['value_chain', 'source_system','usage_purpose','product_category','data_type','table_data_type'];
        if (ck == "source_system") {
          if (sysobj[item[ck + "_lv2"]]) {
            let snm = item[ck + "_lv2"];
            item[ck + "_lv2"] = sysobj[snm][0].LV2_CD;
            item[ck + "_lv1"] = sysobj[snm][0].LV1_CD;
          } else {
            errList.push({ field: ck, lv2: item[ck + "_lv2"] });
          }
        } else {
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
