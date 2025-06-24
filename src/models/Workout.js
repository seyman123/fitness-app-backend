const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Workout = sequelize.define('Workout', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  category: {
    type: DataTypes.ENUM('strength', 'cardio', 'yoga', 'pilates', 'hiit', 'flexibility', 'sports'),
    allowNull: false,
    defaultValue: 'strength'
  },
  difficulty: {
    type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
    allowNull: false,
    defaultValue: 'beginner'
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Estimated duration in minutes'
  },
  estimatedCalories: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Estimated calories burned'
  },
  exercises: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of exercises with sets, reps, etc.'
  },
  isTemplate: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'True for templates, false for user sessions'
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    },
    comment: 'Null for system templates, userId for custom workouts'
  }
}, {
  tableName: 'workouts',
  timestamps: true
});

module.exports = Workout; 