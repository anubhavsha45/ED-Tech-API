const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.ObjectId,
    ref: "Chapter",
    required: [true, "A review must belong to some course"],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: [true, "A review must be done by some student"],
  },

  star: {
    type: Number,
    required: [true, "A review must include stars"],
    max: [5, "Rating must be at most 5"],
    min: [1, "Rating must be at least 1"],
  },

  comment: {
    type: String,
  },
});

const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;
