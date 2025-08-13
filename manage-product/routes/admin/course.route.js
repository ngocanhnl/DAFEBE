const express = require('express');
const router = express.Router();
const controller = require("../../controllers/admin/course.controller");

const validate = require("../../validates/admin/course.validate");
const multer  = require('multer')
const uploadCloud = require("../../middlewares/admin/uploadCloud.middleware");

const upload = multer();



router.get("/",controller.index);

router.patch("/change-status/:status/:id",controller.changeStatus);

router.patch("/change-multi",controller.changeMulti);

router.delete("/delete/:id",controller.delete);

router.get("/create", controller.createGet);

router.post("/create",
            upload.single('thumbnail'),
            uploadCloud.upload,
            validate.createPost,
            controller.createPOST
            );

router.get("/edit/:id",
            upload.single('thumbnail'),
            controller.edit
          );
router.patch("/edit/:id",
            upload.single('thumbnail'),
            uploadCloud.upload,
            validate.createPost,
            controller.editPatch
          );


router.get("/detail/:id",controller.detail);
module.exports = router; 