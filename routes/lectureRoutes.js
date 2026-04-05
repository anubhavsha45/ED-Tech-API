const express = require("express");
const router = express.Router();
const authController = require("./../controllers/authController");
const lectureController = require("./../controllers/lectureController");
const uploadFile = require("./../utils/uploadNotes");
router.use(authController.protect);

router
  .route("/:lectureId")
  .patch(
    authController.restrictTo("teacher"),
    uploadFile.single("notes"),
    lectureController.updateLecture,
  );

module.exports = router;
