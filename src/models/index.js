const User = require('./User');
const UserProfile = require('./UserProfile');
const WeightHistory = require('./WeightHistory');
const Workout = require('./Workout');
const WorkoutSession = require('./WorkoutSession');
const Food = require('./Food');
const FoodEntry = require('./FoodEntry');
const Goal = require('./Goal');

// Define associations

// User relationships
User.hasOne(UserProfile, { foreignKey: 'userId', onDelete: 'CASCADE' });
User.hasMany(WeightHistory, { foreignKey: 'userId', onDelete: 'CASCADE' });
User.hasMany(WorkoutSession, { foreignKey: 'userId', onDelete: 'CASCADE' });
User.hasMany(FoodEntry, { foreignKey: 'userId', onDelete: 'CASCADE' });
User.hasMany(Workout, { foreignKey: 'createdBy', onDelete: 'SET NULL' });
User.hasMany(Goal, { foreignKey: 'userId', onDelete: 'CASCADE' });

// UserProfile relationships
UserProfile.belongsTo(User, { foreignKey: 'userId' });

// WeightHistory relationships
WeightHistory.belongsTo(User, { foreignKey: 'userId' });

// Workout relationships
Workout.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Workout.hasMany(WorkoutSession, { foreignKey: 'workoutId', onDelete: 'SET NULL' });

// WorkoutSession relationships
WorkoutSession.belongsTo(User, { foreignKey: 'userId' });
WorkoutSession.belongsTo(Workout, { foreignKey: 'workoutId' });

// Food relationships
Food.hasMany(FoodEntry, { foreignKey: 'foodId', onDelete: 'CASCADE' });

// FoodEntry relationships
FoodEntry.belongsTo(User, { foreignKey: 'userId' });
FoodEntry.belongsTo(Food, { foreignKey: 'foodId' });

// Goal relationships
Goal.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  User,
  UserProfile,
  WeightHistory,
  Workout,
  WorkoutSession,
  Food,
  FoodEntry,
  Goal
};
