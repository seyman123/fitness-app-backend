const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const UserProfile = sequelize.define('UserProfile', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other'),
    allowNull: true,
  },
  height: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: 'Height in centimeters'
  },
  weight: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: 'Weight in kilograms'
  },
  fitnessGoal: {
    type: DataTypes.ENUM('weight_loss', 'muscle_gain', 'maintain', 'improve_fitness'),
    allowNull: true,
  },
  activityLevel: {
    type: DataTypes.ENUM('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active'),
    allowNull: true,
  },
  dailyWaterTarget: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 2500,
    comment: 'Daily water target in ml'
  },
  dailyCalorieTarget: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Daily calorie target'
  },
}, {
  tableName: 'user_profiles',
  timestamps: true
});

module.exports = UserProfile;
