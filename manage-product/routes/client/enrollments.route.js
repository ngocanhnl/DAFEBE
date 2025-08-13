const express = require("express");
const router = express.Router();
const controller = require("../../controllers/client/enrollments.controller");
const { requireUser } = require("../../middlewares/client/auth.middleware");

router.get("/me/enrollments", requireUser, controller.myEnrollments);
router.get("/classes/:classId", requireUser, controller.classDetailWithLessons);

module.exports = router;


