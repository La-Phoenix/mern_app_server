const express = require("express");
const { check } = require("express-validator");
const { getUsers, signup, login } = require("../Controllers/users-controller");
const Router = express.Router();
const fileUpload = require("../Middleware/file-upload");

Router.get("/", getUsers);

Router.post(
  "/signup",
  fileUpload.single("image"),
  [
    check("name").not().isEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  signup
);
Router.post("/login", login);

module.exports = Router;
