const express = require("express");
const router = express.Router();
const authController = require("./../controllers/authController");
const courseController = require("./../controllers/courseController");
const chapterController = require("./../controllers/chapterController");
const lectureController = require("./../controllers/lectureController");
const upload = require("./../utils/multer");

router.route("/overview").get(courseController.getOverview);

router.use(authController.protect);

router
  .route("/")
  .post(authController.restrictTo("teacher"), courseController.createCourse);

router
  .route("/chapters/:courseId")
  .post(authController.restrictTo("teacher"), chapterController.createChapter);

router
  .route("/lectures/:chapterId")
  .post(
    authController.restrictTo("teacher"),
    upload.single("video"),
    lectureController.createLecture,
  );

router
  .route("/")
  .get(authController.restrictTo("admin"), courseController.getCourses);

router
  .route("/:courseId")
  .get(
    authController.restrictTo("admin", "student"),
    courseController.getCourse,
  );

module.exports = router;
