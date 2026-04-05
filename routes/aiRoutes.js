const express = require("express");
const router = express.Router();
const authController = require("./../controllers/authController");
const aiController = require("./../controllers/aiController");

router.use(authController.protect);

router.route("/generate-notes/:lectureId").post(aiController.generateNotes);

router.route("/generate-quiz/:lectureId").post(aiController.generateQuiz);
module.exports = router;
