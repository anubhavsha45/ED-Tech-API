const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: ["true", "A course must be created by some teacher"],
  },
  title: {
    type: String,
    required: [true, "A course must have some title"],
  },

  chapters: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Chapter",
      required: [true, "A book must include chapters"],
    },
  ],
});

const Course = mongoose.model("Course", courseSchema);

module.exports = Course;
