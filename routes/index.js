const { Router } = require("express");

const router = Router();

router.use("/BusinessGlossaries", require("./businessGlossaries.routes"));
router.use("/NewCatalogs", require("./newCatalog.routes"));

module.exports = router;
