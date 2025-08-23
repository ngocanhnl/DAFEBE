const express = require("express");
const router = express.Router();
const multer  = require('multer')
const userController = require("../../controllers/admin/user.controller");
const authMiddleware = require("../../middlewares/admin/auth.middleware");
const uploadCloud = require("../../middlewares/admin/uploadCloud.middleware");
const upload = multer();
// Áp dụng middleware xác thực cho tất cả routes
router.use(authMiddleware.requireAuth);

// Danh sách người dùng
router.get("/", userController.index);

// Tạo mới người dùng
router.get("/create", userController.create);
router.post("/create",  upload.single('avatar'),uploadCloud.upload, userController.createPost);

// Chỉnh sửa người dùng
router.get("/edit/:id", userController.edit);
router.patch("/edit/:id", upload.single('avatar'),uploadCloud.upload, userController.editPatch);

// Xem chi tiết người dùng
router.get("/detail/:id", userController.detail);

// Xóa người dùng
router.delete("/delete/:id", userController.delete);

// Thay đổi trạng thái người dùng
router.patch("/change-status/:id/:status", userController.changeStatus);

module.exports = router;
