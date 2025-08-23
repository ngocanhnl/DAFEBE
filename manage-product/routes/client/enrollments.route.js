const express = require("express");
const router = express.Router();
const controller = require("../../controllers/client/enrollments.controller");
const { requireUser } = require("../../middlewares/client/auth.middleware");

router.get("/me/enrollments", requireUser, controller.myEnrollments);
router.get("/classes/:classId", requireUser, controller.classDetailWithLessons);
//http://localhost:4000/api/transfer-request/689177a1e3c33cdbe05d872d
// Routes cho chức năng chuyển lớp học
router.post("/transfer-request", requireUser, controller.requestClassTransfer);
router.get("/available-classes/:currentClassId", requireUser, controller.getAvailableClasses);
router.delete("/transfer-request/:enrollmentId", requireUser, controller.cancelTransferRequest);
router.get("/transfer-request/:enrollmentId", requireUser, controller.getTransferRequest);

module.exports = router;


