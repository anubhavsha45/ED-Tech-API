const express = require("express");
const app = express();
const userRoutes = require("./routes/userRoutes");
const globalErrorController = require("./controllers/errorController");
//body parser
app.use(express.json());

//mounted routes
app.use("/api/v1/users", userRoutes);

//global error contrpoller middleware
app.use(globalErrorController);
module.exports = app;
