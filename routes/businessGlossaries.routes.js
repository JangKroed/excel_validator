const { Router } = require("express");
const { businessGlossariesController } = require("../controllers");
const { upload } = require("../middlewares/multer.middleware");

const router = Router();

const { uploadXls, DataUpdateFile } = businessGlossariesController;

router.post("/uploadXls", upload.single("file"), uploadXls);
router.post("/DataUpdateFile", DataUpdateFile);

module.exports = router;
