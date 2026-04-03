const User = require("./../models/userModel");
const Course = require("./../models/courseSchema");
const Chapter = require("./../models/chapterSchema");
const Lecture = require("./../models/lectureSchema");
const catchAsync = require("./../utils/catchAsync");
const appError = require("./../utils/appClass");

exports.createLecture = catchAsync(async (req, res, next) => {
  const { chapterId } = req.params;

  const chapter = await Chapter.findById(chapterId);

  if (!chapter) {
    return next(new appError("There is no chapter with this id", 400));
  }

  const { number, name, notes } = req.body;

  const videoUrl = req.file.path;

  if (!number || !name || !videoUrl) {
    return next(
      new appError(
        "Please provide the nmber,name and video url of this lecture",
        400,
      ),
    );
  }

  const lecture = await Lecture.create({
    chapter: chapterId,
    number,
    name,
    notes,
    videoUrl,
  });

  await Chapter.findByIdAndUpdate(chapterId, {
    $push: { lecture: lecture._id },
  });

  return res.status(201).json({
    status: "success",
    data: {
      lecture,
    },
  });
});
