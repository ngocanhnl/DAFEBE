const express = require("express");
const router = express.Router();
const controller = require("../../controllers/client/auth.controller");
const { requireUser } = require("../../middlewares/client/auth.middleware");
const multer = require("multer");
const storage = require("../../helper/storageMulter")();

const upload = multer({ storage });

router.post("/login", controller.login);
router.get("/me", requireUser, controller.me);
router.post("/me/update", requireUser, upload.single("avatar"), controller.updateMe);

module.exports = router;


