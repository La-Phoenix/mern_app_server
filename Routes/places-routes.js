const express = require("express");
const { check } = require("express-validator");
const fileUpload = require("../Middleware/file-upload");

const {
  getByPlaceId,
  createPlaces,
  updatePlace,
  deletePlace,
  getPlacesByUserId,
} = require("../Controllers/places-controllers");
const checkAuth = require("../Middleware/check-auth");

const Router = express.Router();

Router.get("/:placeId", getByPlaceId);

Router.get("/users/:userId", getPlacesByUserId);

Router.use(checkAuth);

Router.post(
  "/",
  fileUpload.single("image"),
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }),
    check("address").not().isEmpty(),
  ],
  createPlaces
);
Router.patch(
  "/:placeId",
  [check("title").not().isEmpty(), check("description").isLength({ min: 5 })],
  updatePlace
);
Router.delete("/:placeId", deletePlace);

module.exports = Router;
