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
