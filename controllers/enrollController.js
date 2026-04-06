const User = require("./../models/userModel");
const Course = require("./../models/courseSchema");
const Chapter = require("./../models/chapterSchema");
const Lecture = require("./../models/lectureSchema");
const catchAsync = require("./../utils/catchAsync");
const appError = require("./../utils/appClass");
const Enroll = require("./../models/enrollSchema");

exports.createEnrollment = catchAsync(async (req, res, next) => {
  const { courseId } = req.params;

  const enrolledCourse = await Enroll.create({
    user: req.user._id,
    course: courseId,
  });

  return res.status(201).json({
    status: "success",
    data: {
      enrolledCourse,
    },
  });
});

exports.deleteEnroll = catchAsync(async (req, res, next) => {
  const { enrollId } = req.params;

  const enrollment = await Enroll.findByIdAndDelete(enrollId);

  if (!enrollment) {
    return next(new appError("There is no enrollment with this ID", 400));
  }

  return res.status(204).send();
});
