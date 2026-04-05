const express = require("express");
const app = express();
const userRoutes = require("./routes/userRoutes");
const courseRoutes = require("./routes/courseRoutes");
const enrollRoutes = require("./routes/enrollmentRoutes");
const lectureRoutes = require("./routes/lectureRoutes");
const aiRoutes = require("./routes/aiRoutes");
const globalErrorController = require("./controllers/errorController");

//body parser
app.use(express.json());

//mounted routes
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/course", courseRoutes);
app.use("/api/v1/enroll", enrollRoutes);
app.use("/api/v1/lectures", lectureRoutes);
app.use("/api/v1/ai", aiRoutes);

//global error contrpoller middleware
app.use(globalErrorController);
module.exports = app;
