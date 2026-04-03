const User = require("./../models/userModel");
const Course = require("./../models/courseSchema");
const Chapter = require("./../models/chapterSchema");
const Lecture = require("./../models/lectureSchema");
const catchAsync = require("./../utils/catchAsync");
const appError = require("./../utils/appClass");

exports.createCourse = catchAsync(async (req, res, next) => {
  const { title, chapters } = req.body;

  if (!title) {
    return next(new appError("Please give the title of your course", 400));
  }

  const course = await Course.create({
    createdBy: req.user._id,
    title,
    chapters,
  });

  return res.status(201).json({
    status: "success",
    data: {
      course,
    },
  });
});
