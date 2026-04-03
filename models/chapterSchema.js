const mongoose = require("mongoose");

const chapterSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.ObjectId,
    ref:'Course'
    required: [true, "A chapter must belong to some course"],
  },
  number: {
    type: Number,
    required: [true, "A chapter number must be provided"],
  },
  name: {
    type: String,
    required: [true, "A chapter must have some name"],
  },
  lecture: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Lecture",
      required: [true, "A chapter must inlcude some lecture"],
    },
  ],
});

const Chapter = mongoose.model("Chapter", chapterSchema);

module.exports = Chapter;
