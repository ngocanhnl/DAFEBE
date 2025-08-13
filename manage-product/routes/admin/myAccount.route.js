const express = require('express');
const router = express.Router();
const controller = require("../../controllers/admin/myAccount.controller");
const multer  = require('multer')
const uploadCloud = require("../../middlewares/admin/uploadCloud.middleware");

const upload = multer();


router.get("/",controller.index);

router.get("/edit",controller.edit);

router.patch("/edit",
            upload.single('thumbnail'),
            uploadCloud.upload,
            controller.editPatch);

module.exports = router;
