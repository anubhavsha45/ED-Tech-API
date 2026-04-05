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
  const course = await Course.findById(chapter.course);

  if (!course.createdBy.equals(req.user._id)) {
    return next(new appError("not authorized", 401));
  }

  const { number, name } = req.body;

  const videoUrl = req.files?.video?.[0]?.path;
  const notes = req.files?.notes?.[0]?.path;

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

exports.updateLecture = catchAsync(async (req, res, next) => {
  const { lectureId } = req.params;

  const { number, name, description } = req.body;

  const notes = req.file?.path;

  const lecture = await Lecture.findById(lectureId);

  if (!lecture) {
    return next(new appError("There is no lecture with this id", 400));
  }
  const chapter = await Chapter.findById(lecture.chapter);
  const course = await Course.findById(chapter.course);

  if (!course.createdBy.equals(req.user._id)) {
    return next(
      new appError(
        "You did not created this course to which this lecture is assigned",
        400,
      ),
    );
  }
  const updatedLecture = await Lecture.findByIdAndUpdate(
    lectureId,
    {
      number,
      name,
      notes,
      description,
    },
    {
      new: true,
      runValidators: true,
    },
  );

  return res.status(200).json({
    status: "success",
    data: {
      lecture: updatedLecture,
    },
  });
});
