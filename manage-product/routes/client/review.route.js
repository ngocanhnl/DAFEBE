const express = require('express');
const router = express.Router();
const controller = require('../../controllers/client/review.controller');
const authMiddleware = require("../../middlewares/client/auth.middleware");
// Lấy danh sách đánh giá cho 1 khóa học
router.get('/course/:courseId', controller.listByCourse);
// Học viên gửi đánh giá
router.post('/', authMiddleware.requireUser ,controller.create);

module.exports = router;
