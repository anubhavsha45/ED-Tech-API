const User = require("./../models/userModel");
const Course = require("./../models/courseSchema");
const Chapter = require("./../models/chapterSchema");
const Lecture = require("./../models/lectureSchema");
const catchAsync = require("./../utils/catchAsync");
const appError = require("./../utils/appClass");
const Enrollment = require("./../models/enrollSchema");

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

exports.getCourses = catchAsync(async (req, res, next) => {
  const courses = await Course.find()
    .populate({
      path: "createdBy",
      select: "name email",
    })
    .populate({
      path: "chapters",
      populate: {
        path: "lecture",
      },
    });

  return res.status(200).json({
    status: "success",
    data: {
      courses,
    },
  });
});

exports.getOverview = catchAsync(async (req, res, next) => {
  const courses = await Course.find()
    .populate({
      path: "createdBy",
      select: "name email",
    })
    .populate({
      path: "chapters",
      populate: {
        path: "lecture",
        select: "number name",
      },
    });

  return res.status(200).json({
    status: "success",
    data: {
      courses,
    },
  });
});

exports.getCourse = catchAsync(async (req, res, next) => {
  const { courseId } = req.params;

  if (req.user.role === "admin") {
    const course = await Course.findById(courseId)
      .populate({
        path: "createdBy",
        select: "name email",
      })
      .populate({
        path: "chapters",
        populate: {
          path: "lecture",
        },
      });

    return res.status(200).json({
      status: "success",
      data: {
        course,
      },
    });
  }

  const enrollment = await Enrollment.findOne({
    course: courseId,
    user: req.user._id,
  });

  if (!enrollment) {
    const course = await Course.findById(courseId)
      .populate({
        path: "createdBy",
        select: "name email",
      })
      .populate({
        path: "chapters",
        populate: {
          path: "lecture",
          select: "name number",
        },
      });

    return res.status(200).json({
      status: "success",
      data: {
        course,
      },
    });
  }

  const enrolledCourse = await Course.findById(courseId)
    .populate({
      path: "createdBy",
      select: "name email",
    })
    .populate({
      path: "chapters",
      populate: {
        path: "lecture",
      },
    });

  return res.status(200).json({
    status: "success",
    data: {
      enrolledCourse,
    },
  });
});
