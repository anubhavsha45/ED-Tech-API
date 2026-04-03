const jwt = require("jsonwebtoken");
const User = require("./../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const appError = require("./../utils/appClass");
const { promosify } = require("util");
const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.registerUser = catchAsync(async (req, res, next) => {
  const { name, email, password, passwordConfirm } = req.body;

  if (!name || !email || !password || !passwordConfirm) {
    return next(new appError("Please provide all the details", 400));
  }

  const user = await User.create({
    name,
    email,
    password,
    passwordConfirm,
  });

  const token = createToken(user._id);

  const sanitizedUser = {
    name: user.name,
    email: user.email,
    role: user.role,
    token,
  };

  return res.status(201).json({
    status: "success",
    data: {
      user: sanitizedUser,
    },
  });
});

exports.loginUser = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(
      new appError(
        "Please provide all the details that is your email and password",
        400,
      ),
    );
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new appError("Your credentials are incorrect !", 401));
  }

  const token = createToken(user._id);

  const sanitizedUser = {
    name: user.name,
    email: user.email,
    token,
    role: user.role,
  };

  return res.status(200).json({
    status: "success",
    data: {
      user: sanitizedUser,
    },
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new appError("You are not logged in! Please login"));
  }

  const decoded = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET_KEY,
  );

  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(new appError("The user is not logged in anymore", 401));
  }

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new appError("Password recently changed. Please log in again.", 401),
    );
  }

  req.user = currentUser;

  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new appError("You are not authorized to perform this action", 401),
      );
    }
    next();
  };
};
