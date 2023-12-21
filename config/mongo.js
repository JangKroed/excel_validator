const { MongoClient } = require("mongodb");
require("dotenv").config();

const { MONGO_URL } = process.env;

module.exports = { client: new MongoClient(MONGO_URL) };
