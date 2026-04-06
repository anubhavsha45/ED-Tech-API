const express = require("express");
const router = express.Router();
const authController = require("./../controllers/authController");
const enrollController = require("./../controllers/enrollController");

router.use(authController.protect);

router
  .route("/:courseId")
  .post(
    authController.restrictTo("student"),
    enrollController.createEnrollment,
  );

router
  .route("/:enrollId")
  .delete(authController.restrictTo("admin"), enrollController.deleteEnroll);

module.exports = router;
