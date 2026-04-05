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
  description: {
    type: String,
    default: "",
  },
  notes: {
    type: String,
  },
  aiNotes: {
    type: Object,
    default: "",
  },
  quiz: [
    {
      question: {
        type: String,
        required: true,
      },
      options: {
        type: [String],
        validate: [(arr) => arr.length === 4, "Must have 4 options"],
      },
      correctAnswer: {
        type: String,
        required: true,
      },
    },
  ],
  videoUrl: {
    type: String,
    required: true,
  },
});

const Lecture = mongoose.model("Lecture", lectureSchema);

module.exports = Lecture;
