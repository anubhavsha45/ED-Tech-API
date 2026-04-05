const express = require("express");
const router = express.Router();
const authController = require("./../controllers/authController");
const courseController = require("./../controllers/courseController");
const chapterController = require("./../controllers/chapterController");
const lectureController = require("./../controllers/lectureController");
const upload = require("../utils/upload");
const uploadFile = require("./../utils/uploadNotes");
router.route("/overview").get(courseController.getOverview);

router.use(authController.protect);

router
  .route("/")
  .post(authController.restrictTo("teacher"), courseController.createCourse);

router
  .route("/chapters/:courseId")
  .post(authController.restrictTo("teacher"), chapterController.createChapter);

router.route("/lectures/:chapterId").post(
  authController.restrictTo("teacher"),
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "notes", maxCount: 1 },
  ]),
  lectureController.createLecture,
);

router
  .route("/")
  .get(authController.restrictTo("admin"), courseController.getCourses);

router.route("/:courseId").get(courseController.getCourse);

module.exports = router;
