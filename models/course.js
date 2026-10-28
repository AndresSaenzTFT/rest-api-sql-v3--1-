"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Course extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Course.init(
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "The title is required",
          },
          notEmpty: {
            msg: "Please provide the title",
          },
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notNull: {
            msg: "The description is required",
          },
          notEmpty: {
            msg: "Please provide the description",
          },
        },
      },
      estimatedTime: {
        //allow null true by default
        type: DataTypes.STRING,
      },
      materialsNeeded: {
        //allow null true by default
        type: DataTypes.STRING,
      },
    },
    {
      sequelize,
      modelName: "Course",
    },
  );

  Course.associate = (models) => {
    Course.belongsTo(models.User, {
      as: "User",
      foreignKey: {
        fieldName: "userId",
        allowNull: false,
      },
    });
  };

  return Course;
};
