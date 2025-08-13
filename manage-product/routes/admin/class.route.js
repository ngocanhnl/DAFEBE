const express = require('express');
const router = express.Router();
const controller = require("../../controllers/admin/class.controller");

router.get("/", controller.index);

router.patch("/change-status/:status/:id", controller.changeStatus);

router.patch("/change-multi", controller.changeMulti);

router.delete("/delete/:id", controller.delete);

router.get("/create", controller.create);

router.post("/create", controller.createPost);

router.get("/edit/:id", controller.edit);

router.patch("/edit/:id", controller.editPatch);

router.get("/detail/:id", controller.detail);

router.get("/:id/students", controller.viewStudents);

router.patch("/:id/change-instructor", controller.changeInstructor);

router.get('/:id/lessons/manage', controller.manageLessons);
router.post('/:id/lessons/add', controller.addLesson);
router.post('/:id/lessons/:lessonIndex/edit', controller.editLesson);
router.post('/:id/lessons/:lessonIndex/delete', controller.deleteLesson);

module.exports = router; 