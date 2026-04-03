const AppError = require("./../utils/appClass");

// DEV
const sendErrorDev = (err, req, res) => {
  return res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

// PROD
const sendErrorProd = (err, req, res) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  return res.status(500).json({
    status: "error",
    message: "Something went wrong",
  });
};

module.exports = (err, req, res, next) => {
  // clone error (important)
  let error = { ...err };
  error.message = err.message;

  error.statusCode = error.statusCode || 500;
  error.status = error.status || "error";

  // Cast Error
  if (err.name === "CastError") {
    error = new AppError("Invalid ID format", 400);
  }

  // Duplicate key
  if (err.code === 11000) {
    error = new AppError("Duplicate field value", 400);
  }

  // Validation error
  if (err.name === "ValidationError") {
    error = new AppError("Invalid input data", 400);
  }

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(error, req, res);
  } else if (process.env.NODE_ENV === "production") {
    sendErrorProd(error, req, res);
  }
};
