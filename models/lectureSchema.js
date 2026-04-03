const mongoose = require("mongoose");

const lectureSchema = new mongoose.Schema({
  chapter: {
    type: mongoose.Schema.ObjectId,
    required: [true, "A lecture must belong to some chapter"],
  },
  number: {
    type: Number,
    required: [true, "A lecture number must be provided"],
  },
  name: {
    type: String,
    required: [true, "A lecture must have some name"],
  },
  notes: {
    type: String,
  },
  videoUrl: {
    type: String,
    required: true,
  },
});

const Lecture = mongoose.model("Lecture", lectureSchema);

module.exports = Lecture;
