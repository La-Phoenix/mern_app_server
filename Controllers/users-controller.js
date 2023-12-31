const { validationResult } = require("express-validator");
const uuid = require("uuid");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const customApiError = require("../Models/http-error");
const User = require("../Models/user");

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password");
  } catch (e) {
    return next(
      new customApiError("Couldn't fetch users. Try again later...", 500)
    );
  }
  if (users.length === 0) {
    return next(
      new customApiError("No available users yet. Try signing up...", 500)
    );
  }
  res
    .status(200)
    .json({ users: users.map((u) => u.toObject({ getters: true })) });
};
const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new customApiError("Invalid inputs passed, please check your data", 422)
    );
  }
  const { name, email, password } = req.body;
  let existingUser;
  try {
    existingUser = await User.findOne({ email });
  } catch (e) {
    return next(
      new customApiError("Signing up failed, please try again later...", 500)
    );
  }
  if (existingUser) {
    return next(
      new customApiError("User exists. If user, try to login instead.", 401)
    );
  }
  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (error) {
    return next(
      new customApiError("Could not create user, please try again.", 500)
    );
  }

  const newUser = new User({
    name,
    email,
    image: req.file.path,
    password: hashedPassword,
    places: [],
  });
  try {
    await newUser.save();
  } catch (e) {
    return next(
      new customApiError("Signing up failed, please try again later...", 500)
    );
  }
  let token;
  try {
    token = jwt.sign(
      {
        userId: newUser.id,
        email: newUser.email,
      },
      process.env.JWT_KEY,
      {
        expiresIn: "1h",
      }
    );
  } catch (e) {
    return next(
      new customApiError("Signing up failed, please try again later...", 500)
    );
  }
  res
    .status(201)
    .json({ userId: newUser.id, email: newUser.email, token: token });
};
const login = async (req, res, next) => {
  const { email, password } = req.body;
  let user;
  try {
    user = await User.findOne({ email });
  } catch (e) {
    return next(
      new customApiError("Logging in failed, please try again later...", 500)
    );
  }
  if (!user) {
    return next(
      new customApiError("Invalid credentials! Could not login.", 401)
    );
  }
  let isValidPassword;
  try {
    isValidPassword = await bcrypt.compare(password, user.password);
  } catch (error) {
    return next(
      new customApiError(
        "Something went wrong. Could not log you in. Please try again...",
        500
      )
    );
  }
  if (!isValidPassword) {
    return next(
      new customApiError("Invalid credentials! Could not login.", 403)
    );
  }

  let token;
  try {
    token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      process.env.JWT_KEY,
      {
        expiresIn: "1h",
      }
    );
  } catch (e) {
    return next(
      new customApiError("Login failed, please try again later...", 500)
    );
  }
  res.status(200).json({ userId: user.id, email: user.email, token: token });
};

module.exports = {
  getUsers,
  signup,
  login,
};
