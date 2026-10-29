"use strict";

// load modules
const express = require("express");
const morgan = require("morgan");
const router = express.Router();
const { authenticateUser } = require("./middleware/auth-user");
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
      res.location("/").status(201).end(); //response location set only to  / and response set correctly to 201
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
  authenticateUser,
  asyncHandler(async (req, res) => {
    // in req.currentUser, the authenticated user data is stored
    const { id, firstName, lastName, emailAddress } = req.currentUser; //declare the propierties of the usersobject

    res.status(200).json({ id, firstName, lastName, emailAddress }); // display the authenticated user
  }),
);

//get all courses
app.get(
  "/api/courses",
  asyncHandler(async (req, res) => {
    const courses = await Course.findAll({
      include: [
        {
          model: User,
          as: "User",
          attributes: { exclude: ["password"] },
        },
      ],
    });
    res.status(200).json(courses);
  }),
);

//set the handlers correctly
app.post(
  "/api/courses",
  authenticateUser,
  asyncHandler(async (req, res, next) => {
    try {
      const { title, description, estimatedTime, materialsNeeded } = req.body;

      const course = await Course.create({
        title,
        description,
        estimatedTime,
        materialsNeeded,
        userId: req.currentUser.id, // now the course created will assign the authenticated user to the course created
      });

      res.location(`/api/courses/${course.id}`).status(201).end(); // for this res header i set up the path to retrieve the course thar has been created
    } catch (error) {
      if (
        error.name === "SequelizeValidationError" ||
        error.name === "SequelizeUniqueConstraintError"
      ) {
        const errors = error.errors.map((err) => err.message); //shows each error depending on the incorrect fields
        res.status(400).json({ errors });
      } else {
        throw error;
      }
    }
  }),
);

//get specific course
app.get(
  "/api/courses/:id",
  asyncHandler(async (req, res, next) => {
    const course = await Course.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "User",
          attributes: { exclude: ["password"] },
        },
      ], //show user data
    }); //look for the course by its id
    res.status(200).json(course);
  }),
);

//update the following course
app.put(
  "/api/courses/:id",
  authenticateUser,
  asyncHandler(async (req, res) => {
    try {
      const course = await Course.findByPk(req.params.id);
      if (!course) {
        return res.status(400).json({ message: "Course not found" });
      }

      course.set({
        title: req.body.title ?? null,
        description: req.body.description ?? null,
      });
      await course.validate({ fields: ["title", "description"] }); // validate propierties with the model validators
      await course.update(req.body);
      res.status(204).end(); //204 status and not showing any json
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

//delete course
app.delete(
  "/api/courses/:id",
  authenticateUser,
  asyncHandler(async (req, res) => {
    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    await course.destroy();
    res.status(204).end();
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
