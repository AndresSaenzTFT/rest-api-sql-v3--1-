"use strict";

// load modules
const express = require("express");
const morgan = require("morgan");
const router = express.Router();
// variable to enable global error logging
const enableGlobalErrorLogging =
  process.env.ENABLE_GLOBAL_ERROR_LOGGING === "true";

// create the Express app
const app = express();
const sequelize = require("./models").sequelize;
const { User } = require("./models");
const { Course } = require("./models");
const { asyncHandler } = require("./middleware/async-handler");

// setup morgan which gives us http request logging
app.use(morgan("dev"));
app.use(express.json());

// setup a friendly greeting for the root route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to the REST API project!",
  });
});

router.post(
  "/api/users",
  asyncHandler(async (req, res) => {
    try {
      await User.create(req.body);
      res.status(201).json({ message: "Account successfully created!" });
    } catch (error) {
      if (
        error.name === "SequelizeValidationError" ||
        error.name === "SequelizeUniqueConstraintError"
      ) {
        const errors = error.errors.map((err) => err.message);
        res.status(400).json({ errors });
      } else {
        throw error;
      }
    }
  }),
);

router.get(
  "/api/users",
  asyncHandler(async (req, res) => {
    const users = await User.findAll();
    res.status(200).json(users);
  }),
);
//get all courses
app.get(
  "/api/courses",
  asyncHandler(async (req, res) => {
    const courses = await Course.findAll({
      include: [{ model: User, as: "User" }], //show user data
    });
    res.status(200).json(courses);
  }),
);

app.post(
  "/api/courses",
  asyncHandler(async (req, res, next) => {
    const { title, description, estimatedTime, materialsNeeded, userId } =
      req.body;

    if (
      !title ||
      !description ||
      !estimatedTime ||
      !materialsNeeded ||
      !userId
    ) {
      return res.status(400).json({
        message:
          "title, description, estimatedTime ,materialsNeeded, userId are required",
      });
    }

    const user = await User.findByPk(userId); //find by primary key, allways need to pass the primary column, normally the id

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const course = await Course.create({
      title,
      description,
      estimatedTime,
      materialsNeeded,
      userId,
    });
    res.status(201).json(course);
  }),
);

//get specific course
app.get(
  "/api/courses/:id",
  asyncHandler(async (req, res, next) => {
    const course = await Course.findByPk(req.params.id, {
      include: [{ model: User, as: "User" }], //show user data
    }); //look for the course by its id
    res.status(200).json(course);
  }),
);

//update the following course
app.put(
  "/api/courses/:id",
  asyncHandler(async (req, res) => {
    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    await course.update(req.body); //winth update method pass the req.body, there the data from client gets saved
    res.status(200).json(course);
  }),
);

//delete course
app.delete(
  "/api/courses/:id",
  asyncHandler(async (req, res) => {
    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    await course.destroy();
    res.status(200).end();
  }),
);

app.use(router);

// send 404 if no other route matched
app.use((req, res) => {
  res.status(404).json({
    message: "Route Not Found",
  });
});

// setup a global error handler
app.use((err, req, res, next) => {
  if (enableGlobalErrorLogging) {
    console.error(`Global error handler: ${JSON.stringify(err.stack)}`);
  }

  res.status(err.status || 500).json({
    message: err.message,
    error: {},
  });
});

// set our port
app.set("port", process.env.PORT || 5000);

// Authenticate
(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
})();

// Sequelize model synchronization, then start listening on our port.
sequelize.sync().then(() => {
  const server = app.listen(app.get("port"), () => {
    console.log(`Express server is listening on port ${server.address().port}`);
  });
});
