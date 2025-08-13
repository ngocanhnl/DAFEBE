const express = require('express');
const router = express.Router();
const controller = require("../../controllers/admin/attendance.controller");

router.get("/", controller.index);

router.get("/my-classes", controller.myClasses);

router.get("/take-attendance/:classId", controller.takeAttendance);

router.post("/class/:classId/take", controller.takeAttendancePost);

// Load attendance data of a specific session number
router.get("/class/:classId/session/:sessionNumber", controller.getAttendanceBySession);

router.get("/history/:classId", controller.attendanceHistory);

router.get("/view/:id", controller.viewAttendance);

router.get("/edit-attendance/:id", controller.editAttendance);

router.patch("/edit-attendance/:id", controller.editAttendancePatch);

router.delete("/delete-attendance/:id", controller.deleteAttendance);

router.get("/class/:classId/students", controller.viewClassStudents);

module.exports = router; 