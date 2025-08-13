const express = require('express');
const router = express.Router();
const controller = require("../../controllers/admin/enrollment.controller");

router.get("/", controller.index);

router.get("/create", controller.create);

router.post("/create", controller.store);

router.get("/class-info/:id", controller.getClassInfo);

router.get("/check-enrollment", controller.checkEnrollment);

router.patch("/change-status/:status/:id", controller.changeStatus);

router.patch("/change-multi", controller.changeMulti);

router.delete("/delete/:id", controller.delete);

router.get("/detail/:id", controller.detail);

router.patch("/approve/:id", controller.approveEnrollment);

router.patch("/reject/:id", controller.rejectEnrollment);

router.patch("/approve-transfer/:id", controller.approveTransfer);

router.patch("/reject-transfer/:id", controller.rejectTransfer);

router.get("/transfer-requests", controller.viewTransferRequests);

module.exports = router; 