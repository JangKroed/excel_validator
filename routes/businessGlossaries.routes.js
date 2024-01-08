const { Router } = require("express");
const { businessGlossariesController } = require("../controllers");
const { upload } = require("../middlewares/multer.middleware");

const router = Router();

const { uploadXls, DataUpdateFile, listDownload } =
  businessGlossariesController;

router.post("/uploadXls", upload.single("file"), uploadXls);
router.post("/DataUpdateFile", DataUpdateFile);
router.post("/listDownload", upload.single("file"), listDownload);

module.exports = router;
