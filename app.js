const fs = require("fs");
const express = require("express");
const customApiError = require("./Models/http-error");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

const placesRoutes = require("./Routes/places-routes");
const usersRoutes = require("./Routes/users-route");

app.use(express.json());

app.use(cors());
app.use("/uploads/images", express.static(path.join("uploads", "images")));
app.use(express.static(path.join("Public")));

app.use("/api/places", placesRoutes);
app.use("/api/users", usersRoutes);

app.use((req, res, next) => {
  res.sendFile(path.resolve(__dirname, "Public", "index.html"));
});

// app.use((req, res, next) => {
//   return next(new customApiError("Could not find path", 404));
// });

app.use((err, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, () => {
      console.log(err);
    });
  }
  if (res.headerSent) {
    next(err);
  }
  res
    .status(err.statusCode || 500)
    .json({ message: err.message || "An unknown error ocurred!" });
});

mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.bipk9fn.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    app.listen(process.env.PORT || 5000, () => {
      console.log("LISTENING AT PORT 5000");
    });
  })
  .catch((e) => {
    console.log(e);
  });
