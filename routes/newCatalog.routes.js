const { Router } = require("express");
const { newCatalogController } = require("../controllers");
const { upload } = require("../middlewares/multer.middleware");

const router = Router();

const { DataReportUpload, ReportDataUpdateFile } = newCatalogController;

router.post("/DataReportUpload", upload.single("file"), DataReportUpload);
router.post("/ReportDataUpdateFile", ReportDataUpdateFile);

module.exports = router;
