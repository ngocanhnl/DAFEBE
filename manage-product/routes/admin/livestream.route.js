const express = require('express');
const router = express.Router();
const controller = require("../../controllers/admin/livestream.controller");
const authMiddleware = require("../../middlewares/admin/auth.middleware");

// Áp dụng middleware xác thực cho tất cả routes
router.use(authMiddleware.requireAuth);

// Test route
router.get("/test", (req, res) => {
    res.json({ message: "Livestream routes working!" });
});

// Quản lý livestream - phải đặt trước các routes có parameter
router.get("/manage", controller.manageLivestreams);

// Kết nối YouTube OAuth
router.get("/auth/connect", controller.connectYouTube);
router.get("/auth/oauth2callback", controller.oauthCallback);

// Lấy trạng thái livestream
router.get("/:classId/status", controller.getLivestreamStatus);

// Tạo livestream mới
router.post("/:classId/create", controller.createLivestream);

// Bắt đầu livestream
router.post("/:classId/start", controller.startLivestream);

// Dừng livestream
router.post("/:classId/stop", controller.stopLivestream);

// Reset livestream (xóa broadcast cũ, làm mới trạng thái DB)
router.post("/:classId/reset", controller.resetLivestream);

// Xem livestream - phải đặt cuối cùng
router.get("/:classId", controller.viewLivestream);

module.exports = router;
