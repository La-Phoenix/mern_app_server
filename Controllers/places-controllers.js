const fs = require("fs");
const customApiError = require("../Models/http-error");
const uuid = require("uuid");
const { validationResult } = require("express-validator");
const getCoordsForAddress = require("../Utils/location");
const Place = require("../Models/place");
const { default: mongoose } = require("mongoose");
const User = require("../Models/user");

const getByPlaceId = async (req, res, next) => {
  const { placeId } = req.params;
  let place;
  try {
    place = await Place.findById(placeId);
  } catch (e) {
    return next(
      new customApiError(
        "Something went wrong, could not find place. Try again...",
        500
      )
    );
  }

  if (!place) {
    return next(new customApiError(`Could not places with ${placeId}`, 404));
  }
  res.json({ place: place.toObject({ getters: true }) });
};

const getPlacesByUserId = async (req, res, next) => {
  const { userId } = req.params;
  // let places;
  // try {
  //   places = await Place.find({ creator: userId });
  // } catch (e) {
  //   return next(
  //     new customApiError(
  //       "Something went wrong, could not find your places. Try again...",
  //       500
  //     )
  //   );
  // }
  let userWithPlaces;
  try {
    userWithPlaces = await User.findById(userId).populate("places");
  } catch (e) {
    return next(
      new customApiError(
        "Something went wrong, could not find your places. Try again...",
        500
      )
    );
  }
  if (!userWithPlaces || userWithPlaces.places.length === 0) {
    return next(
      new customApiError(`Could not find a place with ${userId}`, 404)
    );
  }
  res.json({
    places: userWithPlaces.places.map((place) =>
      place.toObject({ getters: true })
    ),
  });
};

const createPlaces = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new customApiError("Invalid inputs passed, please check your data", 422)
    );
  }
  const { title, description, address } = req.body;
  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (e) {
    next(e);
  }
  const newPlace = new Place({
    title,
    description,
    coordinates,
    address,
    location: coordinates,
    image: req.file.path,
    creator: req.userData.userId,
  });

  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (e) {
    return next(
      new customApiError("Could not create place. Try again later...", 500)
    );
  }

  if (!user) {
    return next(
      new customApiError("Could not find user for provided id.", 404)
    );
  }
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await newPlace.save({ session: sess });
    user.places.push(newPlace);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (e) {
    return next(
      new customApiError("Creating Place Failed. Please, try again...", 500)
    );
  }
  res.status(201).json({ place: newPlace });
};

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new customApiError("Invalid inputs passed, please check your data", 422)
    );
  }
  const { placeId } = req.params;
  const { title, description } = req.body;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (e) {
    return next(
      new customApiError(
        "Something went wrong could not update place. Try again...",
        500
      )
    );
  }

  if (place.creator.toString() !== req.userData.userId) {
    return next(
      new customApiError("You are not allowed to edit this place!", 401)
    );
  }

  let updatedPlace;
  try {
    updatedPlace = await Place.findByIdAndUpdate(placeId, {
      title,
      description,
    });
  } catch (e) {
    return next(
      new customApiError(
        "Something went wrong could not update place. Try again...",
        500
      )
    );
  }

  res.status(200).json({ place: updatedPlace.toObject({ getters: true }) });
};
const deletePlace = async (req, res, next) => {
  const { placeId } = req.params;
  let deletedPlace;
  try {
    deletedPlace = await Place.findById(placeId).populate("creator");
  } catch (e) {
    return next(
      new customApiError(
        "Something went wrong, could not delete place. Try again...",
        500
      )
    );
  }
  if (!deletedPlace) {
    return next(new customApiError("Place does not exist.", 404));
  }

  if (deletedPlace.creator.id !== req.userData.userId) {
    return next(
      new customApiError("You are not allowed to delete this place!", 401)
    );
  }
  const imagePath = deletedPlace.image;
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await deletedPlace.remove({ session: sess });
    deletedPlace.creator.places.pull(deletedPlace);
    await deletedPlace.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (e) {
    return next(
      new customApiError(
        "Something went wrong, could not delete place. Try again...",
        500
      )
    );
  }
  fs.unlink(imagePath, (e) => {
    console.log(e);
  });
  res.status(200).json({ message: "Deleted place" });
};
module.exports = {
  getByPlaceId,
  getPlacesByUserId,
  createPlaces,
  updatePlace,
  deletePlace,
};
