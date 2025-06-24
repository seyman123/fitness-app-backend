const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const FoodEntry = sequelize.define('FoodEntry', {
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
  foodId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'foods',
      key: 'id'
    }
  },
  quantity: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 1,
    comment: 'Quantity in servings or grams'
  },
  unit: {
    type: DataTypes.ENUM('serving', 'gram', 'cup', 'piece', 'ml'),
    allowNull: false,
    defaultValue: 'serving'
  },
  meal: {
    type: DataTypes.ENUM('breakfast', 'lunch', 'dinner', 'snack'),
    allowNull: false,
    defaultValue: 'breakfast'
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Calculated nutrition values for this entry
  totalCalories: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: 'Calculated total calories for this entry'
  },
  totalProtein: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: 'Calculated total protein for this entry'
  },
  totalCarbs: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: 'Calculated total carbs for this entry'
  },
  totalFat: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: 'Calculated total fat for this entry'
  }
}, {
  tableName: 'food_entries',
  timestamps: true,
  indexes: [
    {
      fields: ['userId', 'date']
    },
    {
      fields: ['meal']
    }
  ]
});

module.exports = FoodEntry; 