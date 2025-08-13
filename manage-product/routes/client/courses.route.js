const express = require("express");
const router = express.Router();
const controller = require("../../controllers/client/courses.controller");

router.get("/courses", controller.listCourses);
router.get("/courses/:id", controller.getCourseDetail);
router.get("/categories", controller.listCategories);
router.get("/courses/:courseId/classes", controller.listClassesByCourse);

module.exports = router;


