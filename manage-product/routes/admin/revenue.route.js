const express = require('express');
const router = express.Router();
const controller = require("../../controllers/admin/revenue.controller");

router.get("/", controller.index);

router.get("/statistics", controller.statistics);

router.get("/export", controller.exportData);

router.get("/by-course", controller.byCourse);

router.get("/by-instructor", controller.byInstructor);

router.get("/by-period", controller.byPeriod);

router.get("/top-courses", controller.topCourses);

router.get("/top-instructors", controller.topInstructors);

router.get("/enrollment-stats", controller.enrollmentStats);

module.exports = router; 