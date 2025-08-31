const express = require("express");
const router = express.Router();
const controller = require("../../controllers/admin/enrollment.controller");
const { requireAuth } = require("../../middlewares/admin/auth.middleware");

// Routes cho quản lý enrollment
router.get("/", requireAuth, controller.index);

// Routes cho quản lý yêu cầu chuyển lớp
router.get("/transfer-requests", requireAuth, controller.getTransferRequests);
router.get("/transfer-requests/:id", requireAuth, controller.getTransferRequestDetail);
router.post("/transfer-requests/:id/approve", requireAuth, controller.approveTransferRequest);
// Admin duyệt chuyển trạng thái sang pending_teacher_approval
router.post("/transfer-requests/:id/Adminapprove", requireAuth, controller.adminApproveTransferRequest);
router.post("/transfer-requests/:id/reject", requireAuth, controller.rejectTransferRequest);

module.exports = router; 