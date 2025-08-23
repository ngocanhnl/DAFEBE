const express = require("express");
const router = express.Router();
const controller = require("../../controllers/client/livestream.controller");
const { requireUser } = require("../../middlewares/client/auth.middleware");

// Áp dụng middleware xác thực cho tất cả routes
router.use(requireUser);

// Debug API
router.get("/debug", controller.debugLivestream);

// Lấy danh sách livestream của học sinh
router.get("/classes", controller.getMyLivestreams);

// Lấy thông tin livestream của một lớp cụ thể
router.get("/class/:classId", controller.getClassLivestream);

// Lấy danh sách livestream đang hoạt động
router.get("/active", controller.getActiveLivestreams);

module.exports = router;
