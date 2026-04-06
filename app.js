const express = require("express");
const app = express();
const userRoutes = require("./routes/userRoutes");
const courseRoutes = require("./routes/courseRoutes");
const enrollRoutes = require("./routes/enrollmentRoutes");
const lectureRoutes = require("./routes/lectureRoutes");
const aiRoutes = require("./routes/aiRoutes");
const globalErrorController = require("./controllers/errorController");
const rateLimit = require("express-rate-limit");

app.set("trust proxy", 1);

//body parser
app.use(express.json());

const limiter = rateLimit({
  max: 100, // max 100 requests
  windowMs: 60 * 60 * 1000, // per 1 hour
  message: {
    status: "fail",
    message: "Too many requests from this IP, please try again later.",
  },
});

const aiLimiter = rateLimit({
  max: 20, // only 20 requests per hour
  windowMs: 60 * 60 * 1000,
  message: {
    status: "fail",
    message: "Too many AI requests, please try later.",
  },
});

//Rate limit for ai routes

app.use("/api/v1/ai", aiLimiter);

//Rate limit for /api

app.use("/api", limiter);

//mounted routes
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/course", courseRoutes);
app.use("/api/v1/enroll", enrollRoutes);
app.use("/api/v1/lectures", lectureRoutes);
app.use("/api/v1/ai", aiRoutes);

//global error contrpoller middleware
app.use(globalErrorController);
module.exports = app;
