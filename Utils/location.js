const axios = require("axios");
const customApiError = require("../Models/http-error");
const API_KEY = process.env.GOOGLE_API;

const getCoordsForAddress = async (address) => {
  return {
    lat: 40.7484474,
    lng: -73.9871516,
  };
  // const { data } = await axios.get(
  //   `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
  //     address
  //   )}&key=${API_KEY}`
  // );
  // if (!data || data.status === "ZERO_RESULTS") {
  //   throw new customApiError(
  //     "Could not find location for the specified address.",
  //     422
  //   );
  // }
  // const coordinates = data.results[0].geometry.location;
  // return coordinates;
};

module.exports = getCoordsForAddress;
