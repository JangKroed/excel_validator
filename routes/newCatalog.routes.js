const { Router } = require("express");
const { newCatalogController } = require("../controllers");
const { upload } = require("../middlewares/multer.middleware");

const router = Router();

const {
  DataReportUpload,
  ReportDataUpdateFile,
  DataInterfaceUpload,
  InterfaceDataUpdateFile,
} = newCatalogController;

// report
router.post("/DataReportUpload", upload.single("file"), DataReportUpload);
router.post("/ReportDataUpdateFile", ReportDataUpdateFile);

// interface
router.post("/DataInterfaceUpload", upload.single("file"), DataInterfaceUpload);
router.post("/InterfaceDataUpdateFile", InterfaceDataUpdateFile);

module.exports = router;
