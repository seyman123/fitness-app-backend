const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const WorkoutSession = sequelize.define('WorkoutSession', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  workoutId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'workouts',
      key: 'id'
    },
    comment: 'Reference to workout template, null for custom sessions'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Actual duration in minutes'
  },
  exercises: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Completed exercises with actual sets, reps, weights'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  caloriesBurned: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Estimated calories burned'
  },
  status: {
    type: DataTypes.ENUM('in_progress', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'in_progress'
  }
}, {
  tableName: 'workout_sessions',
  timestamps: true
});

module.exports = WorkoutSession; 