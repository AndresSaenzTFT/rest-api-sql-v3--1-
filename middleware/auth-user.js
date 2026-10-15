"use strict";

const { parse: parseBasicAuth } = require("basic-auth"); //import basic-auth
const { User } = require("../models");
const { asyncHandler } = require("./async-handler");
const bcrypt = require("bcrypt");

exports.authenticateUser = asyncHandler(async (req, res, next) => {
  const credentials = parseBasicAuth(req.headers.authorization);

  if (!credentials) {
    return res.status(401).json({ message: "Access Denied" });
  }

  const user = await User.findOne({
    where: { emailAddress: credentials.name },
  });

  if (!user || !(await bcrypt.compare(credentials.pass, user.password))) {
    return res.status(401).json({ message: "Access Denied" });
  }

  req.currentUser = user;
  next();
});
