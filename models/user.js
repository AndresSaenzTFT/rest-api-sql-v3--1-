"use strict";
const { Model } = require("sequelize");
const bcrypt = require("bcrypt");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  User.init(
    {
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "The first name is required",
          },
          notEmpty: {
            msg: "Please provide the first name",
          },
        },
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "The last name is required",
          },
          notEmpty: {
            msg: "Please provide the last name",
          },
        },
      },
      emailAddress: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
          msg: "The email you entered already exists",
        },
        validate: {
          notNull: {
            msg: "An email is required",
          },
          isEmail: {
            msg: "Please provide a valid email address",
          },
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "A password is required",
          },
          notEmpty: {
            msg: "Please provide a password",
          },
          len: {
            args: [8, 20],
            msg: "The password should be between 8 and 20 characters in length",
          },
        },
      },
      confirmedPassword: {
        type: DataTypes.VIRTUAL,
        allowNull: false,
        validate: {
          notNull: { msg: "Please confirm your password" },
          isConfirmed(value) {
            if (value !== this.password) {
              throw new Error("Both passwords must match");
            }
          },
        },
      },
    },
    {
      //hashed password stored in password column
      sequelize,
      modelName: "User",
      hooks: {
        beforeCreate: async (user) => {
          user.password = await bcrypt.hash(user.password, 10);
        },
      },
    },
  );

  User.associate = (models) => {
    User.hasMany(models.Course, {
      as: "User",
      foreignKey: {
        fieldName: "userId",
        allowNull: false,
      },
    });
  };

  return User;
};
