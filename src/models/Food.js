const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Food = sequelize.define('Food', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  brand: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  barcode: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true
  },
  servingSize: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 100,
    comment: 'Serving size in grams'
  },
  calories: {
    type: DataTypes.FLOAT,
    allowNull: false,
    comment: 'Calories per serving'
  },
  protein: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0,
    comment: 'Protein in grams per serving'
  },
  carbs: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0,
    comment: 'Carbohydrates in grams per serving'
  },
  fat: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0,
    comment: 'Fat in grams per serving'
  },
  fiber: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0,
    comment: 'Fiber in grams per serving'
  },
  sugar: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0,
    comment: 'Sugar in grams per serving'
  },
  sodium: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0,
    comment: 'Sodium in mg per serving'
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Food category (fruits, vegetables, etc.)'
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'True for system/verified foods, false for user-added'
  }
}, {
  tableName: 'foods',
  timestamps: true,
  indexes: [
    {
      fields: ['name']
    },
    {
      fields: ['category']
    }
  ]
});

module.exports = Food; 