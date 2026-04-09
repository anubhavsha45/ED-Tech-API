const User = require("./../models/userModel");
const Course = require("./../models/courseSchema");
const Chapter = require("./../models/chapterSchema");
const Lecture = require("./../models/lectureSchema");
const catchAsync = require("./../utils/catchAsync");
const appError = require("./../utils/appClass");

exports.createChapter = catchAsync(async (req, res, next) => {
  const { courseId } = req.params;

  const course = await Course.findById(courseId);
  if (!course) {
    return next(new appError("There is no course with this id", 400));
  }
  if (!course.createdBy.equals(req.user._id)) {
    return next(new appError("You did not created this course", 400));
  }
  const { number, name, lecture } = req.body;

  if (!number || !name) {
    return next(
      new appError(
        "Please enter the serial no. of lecture and also its name",
        400,
      ),
    );
  }
  const chapter = await Chapter.create({
    course: courseId,
    number,
    name,
    lecture,
  });

  await Course.findByIdAndUpdate(courseId, {
    $push: { chapters: chapter._id },
  });

  return res.status(201).json({
    status: "success",
    data: {
      chapter,
    },
  });
});
