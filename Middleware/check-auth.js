const jwt = require("jsonwebtoken");
const customApiError = require("../Models/http-error");

module.exports = (req, res, next) => {
  // if (req.method === "OPTIONS") {
  //   return next();
  // }
  try {
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      throw new customApiError("Authentication failed!", 403);
    }
    const decodedToken = jwt.verify(token, process.env.JWT_KEY);
    req.userData = {
      userId: decodedToken.userId,
    };
    next();
  } catch (error) {
    return next(new customApiError("Authentication failed", 403));
  }
};
