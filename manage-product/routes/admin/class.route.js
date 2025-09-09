const express = require('express');
const router = express.Router();
const controller = require("../../controllers/admin/class.controller");
const multer = require('multer');
const upload = multer();
const uploadFileMiddleware = require("../../middlewares/admin/uploadFile.middleware");
const uploadFile =  multer({ storage: multer.memoryStorage() });



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

// Chat management page for instructor/admin
router.get("/:id/chat", controller.viewChat);

// Routes cho giáo viên duyệt học viên
router.post("/:id/approve-student/:enrollmentId", controller.approveStudent);
router.post("/:id/reject-student/:enrollmentId", controller.rejectStudent);

router.patch("/:id/change-instructor", controller.changeInstructor);

router.get('/:id/lessons/manage', controller.manageLessons);
// router.post('/:id/lessons/add', uploadFile.single('lesson_file'), uploadFileMiddleware.uploadFile, controller.addLesson);
router.post('/:id/lessons/add', uploadFile.single('lesson_file'), uploadFileMiddleware.uploadFile, controller.addLesson);
router.post('/:id/lessons/:lessonIndex/edit', upload.single('lesson_file'), uploadFileMiddleware.uploadFile, controller.editLesson);
router.post('/:id/lessons/:lessonIndex/delete', controller.deleteLesson);
router.post('/:id/lessons/:lessonIndex/delete-file', controller.deleteLessonFile);

// router.get("/download/lesson-files/:publicId", controller.downloadFile);

module.exports = router; 