const mongoose = require("mongoose");

const enrollSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: [true, "A enrolled course must belong to some user"],
  },

  course: {
    type: mongoose.Schema.ObjectId,
    ref: "Course",
    required: [true, "A user must enrolled to some course"],
  },

  enrolledAt: {
    type: Date,
    default: Date.now(),
  },
});

enrollSchema.index(
  {
    user: 1,
    course: 1,
  },
  {
    unique: true,
  },
);

const Enroll = mongoose.model("Enroll", enrollSchema);

module.exports = Enroll;
