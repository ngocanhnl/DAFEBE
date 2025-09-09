const express = require("express");
const router = express.Router();
const controller = require("../../controllers/client/auth.controller");
const { requireUser } = require("../../middlewares/client/auth.middleware");
const multer = require("multer");
const storage = require("../../helper/storageMulter")();

const upload = multer({ storage });

router.post("/login", controller.login);
router.post("/register", controller.register);
router.get("/verify-email", controller.verifyEmail);
router.post("/send-otp", controller.sendOtp);
router.post("/verify-otp", controller.verifyOtp);
router.post("/check-otp", controller.checkOtp);
router.post("/reset-password", controller.resetPassword);
router.get("/me", requireUser, controller.me);
router.post("/me/update", requireUser, upload.single("avatar"), controller.updateMe);

module.exports = router;


